import ctypes
import gc
import hashlib
import json
import math
import os
import re
import shutil
import tempfile
import time
import warnings
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import librosa
import numpy as np
import requests
import soundfile as sf
import torch
import torch.nn.functional as F
import torchaudio
from bs4 import BeautifulSoup
from transformers import AutoFeatureExtractor, WavLMForXVector

from transformers import AutoFeatureExtractor, WavLMForXVector

warnings.filterwarnings("ignore", category=UserWarning)

def trim_system_ram() -> None:
    """Forces Linux glibc memory allocator to release freed C-heap RAM back to OS."""
    try:
        ctypes.CDLL("libc.so.6").malloc_trim(0)
    except Exception:
        pass


# =============================================================================
# Configuration
# =============================================================================

BASE_URL = "https://www.mp3quran.net/eng"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

MODEL_NAME = "microsoft/wavlm-base-plus-sv"
DEVICE = torch.device("cuda")

# Max GPU VRAM utilization: 64 vectors per forward pass (uses ~4-6 GB of 15 GB VRAM).
MAX_GPU_BATCH_SIZE = 64

TARGET_SR = 16_000
CLIP_SECONDS = 60
SEGMENT_SECONDS = 15
OVERLAP_SECONDS = 0
SEGMENT_SAMPLES = TARGET_SR * SEGMENT_SECONDS
HOP_SAMPLES = TARGET_SR * (SEGMENT_SECONDS - OVERLAP_SECONDS)

# Conservative DSP quality gates.
MIN_RMS_DBFS = -48.0
MIN_HNR_DB = 6.0
MIN_CLIMAX_HNR_DB = 10.0
MIN_VOICED_RATIO = 0.15

# Hard cap: max 120 minutes of processed audio per Qari
MAX_QARI_AUDIO_SECONDS = 120 * 60

# A 250 MB ceiling prevents a malformed URL or unexpectedly huge source from
# consuming the Colab VM disk. Only one audio file is ever downloaded per Qari.
MAX_AUDIO_BYTES = 250 * 1024 * 1024
REQUEST_TIMEOUT = (20, 120)

# Quranic male/female vocal ranges. yin returns values for voiced frames.
F0_MIN_HZ = 55.0
F0_MAX_HZ = 550.0
F0_HOP_LENGTH = 1024
F0_FRAME_LENGTH = 2048


# =============================================================================
# Common helpers
# =============================================================================

def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()

def safe_folder_name(name: str) -> str:
    """Filesystem-safe, recognizably named scratch subfolder."""
    clean = re.sub(r'[<>:"/\\|?*\x00-\x1f]+', "_", name).strip(" ._")
    clean = re.sub(r"\s+", " ", clean)
    return (clean or "unnamed_qari")[:100]

def qari_id_from_url(profile_url: str) -> str:
    """Stable ID: avoids collisions where display names are identical."""
    digest = hashlib.sha256(profile_url.encode("utf-8")).hexdigest()[:20]
    return f"qari_{digest}"

def l2_normalized_list(vector: np.ndarray) -> list:
    vector = np.asarray(vector, dtype=np.float32)
    norm = float(np.linalg.norm(vector))
    if norm > 0:
        vector = vector / norm
    return vector.astype(np.float32).tolist()

def atomic_write_ledger(payload: dict) -> None:
    """
    Write beside the destination, fsync it, then replace the old ledger.
    The temporary file is in Google Drive's destination directory so the
    replace operation is as atomic as the Drive mount permits.
    """
    PERSISTENT_ROOT.mkdir(parents=True, exist_ok=True)

    fd, temporary_name = tempfile.mkstemp(
        prefix=".master_vector_matrix.",
        suffix=".tmp",
        dir=str(PERSISTENT_ROOT),
    )

    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.flush()
            os.fsync(handle.fileno())

        os.replace(temporary_name, LEDGER_PATH)
    except Exception:
        if os.path.exists(temporary_name):
            os.remove(temporary_name)
        raise

def commit_qari_record(qari_id: str, record: dict) -> None:
    """
    Update memory and Drive together. If Drive serialization fails, restore the
    in-memory ledger so this Qari will not be incorrectly skipped in this run.
    """
    profiles = LEDGER.setdefault("profiles", {})
    old_record = profiles.get(qari_id)
    profiles[qari_id] = record

    try:
        atomic_write_ledger(LEDGER)
    except Exception:
        if old_record is None:
            profiles.pop(qari_id, None)
        else:
            profiles[qari_id] = old_record
        raise


# =============================================================================
# Dynamic scraper: homepage cards -> profile page -> first MP3 URL
# =============================================================================

SESSION = requests.Session()
SESSION.headers.update(HEADERS)

def fetch_soup(url: str) -> BeautifulSoup:
    response = SESSION.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")

def discover_qari_cards() -> list[dict]:
    """
    Uses the requested source structure:
        soup.find_all("a", class_=lambda x: x and "card-read" in x)
    """
    soup = fetch_soup(BASE_URL)
    cards = soup.find_all(
        "a",
        class_=lambda classes: classes and "card-read" in classes,
    )

    qaris = []
    seen_urls = set()

    for card in cards:
        href = card.get("href")
        if not href:
            continue

        profile_url = urljoin(BASE_URL, href)
        if profile_url in seen_urls:
            continue

        name = card.get_text(" ", strip=True)
        if not name:
            name = Path(urlparse(profile_url).path).name or "Unnamed Qari"

        seen_urls.add(profile_url)
        qaris.append({
            "name": name,
            "profile_url": profile_url,
            "qari_id": qari_id_from_url(profile_url),
        })

    return qaris

def mp3_links_from_page(soup: BeautifulSoup, page_url: str) -> list[dict]:
    """Find, deduplicate, and Surah-sort direct MP3 URLs from one page."""
    candidates = []

    for tag in soup.find_all(["a", "audio", "source"]):
        for attribute in ("href", "src", "data-url", "data-audio", "data-src"):
            value = tag.get(attribute)
            if value and ".mp3" in value.lower():
                absolute_url = urljoin(page_url, value.strip())
                parsed_path = urlparse(absolute_url).path.lower()
                if not parsed_path.endswith(".mp3"):
                    continue

                label = tag.get_text(" ", strip=True)
                match = re.search(
                    r"(?<!\d)(\d{1,3})(?!\d)",
                    parsed_path,
                )
                surah_number = int(match.group(1)) if match else 999

                candidates.append({
                    "url": absolute_url,
                    "label": label,
                    "surah_number": surah_number if 1 <= surah_number <= 114 else 999,
                })

    # Also support MP3 URLs embedded in scripts / serialized page data.
    html = str(soup).replace("\\/", "/")
    for match in re.findall(r"""["']([^"']+?\.mp3(?:\?[^"']*)?)["']""", html, flags=re.I):
        absolute_url = urljoin(page_url, match)
        parsed_path = urlparse(absolute_url).path.lower()
        if not parsed_path.endswith(".mp3"):
            continue

        number_match = re.search(r"(?<!\d)(\d{1,3})(?!\d)", parsed_path)
        surah_number = int(number_match.group(1)) if number_match else 999

        candidates.append({
            "url": absolute_url,
            "label": "",
            "surah_number": surah_number if 1 <= surah_number <= 114 else 999,
        })

    unique = {}
    for item in candidates:
        if urlparse(item["url"]).scheme in {"http", "https"}:
            unique.setdefault(item["url"], item)

    return sorted(
        unique.values(),
        key=lambda item: (item["surah_number"], item["url"]),
    )


def discover_surah_sources(profile_url: str) -> tuple[list[dict], str]:
    """
    Prefer the Qari's Download page. If it does not exist or has no MP3 links,
    use individual Surah links directly from the Qari profile page.
    """
    profile_soup = fetch_soup(profile_url)

    download_page_url = None
    for anchor in profile_soup.find_all("a", href=True):
        candidate_url = urljoin(profile_url, anchor["href"])
        candidate_path = urlparse(candidate_url).path.rstrip("/")

        if candidate_path.endswith("/downloads"):
            download_page_url = candidate_url
            break

    if download_page_url:
        try:
            download_soup = fetch_soup(download_page_url)
            sources = mp3_links_from_page(download_soup, download_page_url)
            if sources:
                return sources, "download_page_surahs"
        except Exception as exc:
            print(f"  Download page unavailable: {type(exc).__name__}: {exc}")

    sources = mp3_links_from_page(profile_soup, profile_url)
    return sources, "profile_page_surahs"

def download_single_audio(audio_url: str, destination: Path) -> None:
    """
    Stream exactly one source MP3 to destination. Automatically handles
    direct MP3 URL conversion if mp3quran download landing URLs are encountered.
    """
    urls_to_try = [audio_url]
    if "/download/" in audio_url:
        urls_to_try.append(audio_url.replace("/download/", "/"))

    last_error = None
    for url in urls_to_try:
        try:
            with SESSION.get(url, stream=True, timeout=REQUEST_TIMEOUT, allow_redirects=True) as response:
                response.raise_for_status()

                content_type = response.headers.get("Content-Type", "").lower()
                if "text/html" in content_type:
                    raise ValueError("URL returned text/html instead of audio stream.")

                bytes_written = 0
                first_chunk = True

                with destination.open("wb") as handle:
                    for block in response.iter_content(chunk_size=1024 * 1024):
                        if not block:
                            continue

                        if first_chunk:
                            first_chunk = False
                            prefix = block[:100].lower()
                            if b"<!doctype" in prefix or b"<html" in prefix or b"head" in prefix:
                                raise ValueError("Server response is HTML web page, not MP3 audio.")

                        bytes_written += len(block)
                        if bytes_written > MAX_AUDIO_BYTES:
                            raise ValueError("Audio exceeded max size limit.")

                        handle.write(block)

                if bytes_written < 4_096:
                    raise ValueError("Downloaded file is implausibly small.")

                return
        except Exception as exc:
            last_error = exc
            if destination.exists():
                destination.unlink()

    raise ValueError(f"Failed to download audio from {audio_url}: {last_error}")


def load_audio_16k_mono_gpu(audio_path: Path) -> torch.Tensor:
    """
    Decodes MP3/WAV/AAC audio directly into a 16 kHz mono float32 torch.Tensor on DEVICE (cuda).
    Uses torchaudio (C++ FFmpeg backend) with robust librosa fallback.
    """
    try:
        tensor, sr = torchaudio.load(str(audio_path))
        if tensor.numel() == 0 or sr <= 0:
            raise ValueError("Audio file is empty or unreadable.")
        if tensor.shape[0] > 1:
            tensor = torch.mean(tensor, dim=0, keepdim=True)
        tensor = tensor.squeeze(0).to(DEVICE, non_blocking=True)
        if sr != TARGET_SR:
            tensor = torchaudio.functional.resample(tensor, orig_freq=sr, new_freq=TARGET_SR)
        if tensor.numel() == 0:
            raise ValueError("Resampled audio is empty.")
        return tensor.to(torch.float32)
    except Exception:
        waveform, sr = librosa.load(str(audio_path), sr=TARGET_SR, mono=True, dtype=np.float32)
        if waveform.size == 0 or sr <= 0:
            raise ValueError("Decoded audio waveform is empty.")
        return torch.from_numpy(waveform).to(DEVICE, dtype=torch.float32)


# =============================================================================
# GPU-Accelerated DSP filters
# =============================================================================

def rms_dbfs_gpu(samples: torch.Tensor) -> float:
    """Computes RMS DBFS directly on GPU PyTorch Tensor."""
    rms = torch.sqrt(torch.mean(samples.double() ** 2)).item()
    return 20.0 * math.log10(max(rms, 1e-12))

def hnr_db_gpu(samples: torch.Tensor) -> float:
    """
    Fast GPU harmonic-vs-residual estimate using PyTorch STFT on CUDA.
    Avoids CPU STFT and Librosa HPSS overhead.
    """
    n_fft = 2048
    hop_length = 512
    if samples.shape[0] < n_fft:
        return -100.0

    window = torch.hann_window(n_fft, device=samples.device)
    stft = torch.stft(
        samples,
        n_fft=n_fft,
        hop_length=hop_length,
        window=window,
        return_complex=True,
    )
    mag = torch.abs(stft)

    harmonic_mag = F.avg_pool2d(
        mag.unsqueeze(0).unsqueeze(0),
        kernel_size=(1, 7),
        stride=1,
        padding=(0, 3),
    ).squeeze(0).squeeze(0)
    residual_mag = torch.clamp(mag - harmonic_mag, min=0.0)

    h_pwr = torch.mean(harmonic_mag.double() ** 2).item()
    r_pwr = torch.mean(residual_mag.double() ** 2).item()
    return 10.0 * math.log10((h_pwr + 1e-12) / (r_pwr + 1e-12))

def extract_f0_gpu(samples: torch.Tensor) -> tuple[torch.Tensor, float, float]:
    """
    100% GPU-accelerated PyTorch YIN pitch estimation on CUDA Tensor.
    Replaces CPU Librosa YIN to eliminate System RAM bloat and run 10x faster on T4.
    """
    if samples.shape[0] < F0_FRAME_LENGTH * 2:
        return torch.empty(0, device=DEVICE), 0.0, float("nan")

    # Unfold into 2D framed tensor on CUDA: shape (num_frames, F0_FRAME_LENGTH)
    frames = samples.unfold(0, F0_FRAME_LENGTH, F0_HOP_LENGTH)
    num_frames, frame_length = frames.shape

    # Zero-padded Real FFT for fast autocorrelation on GPU
    n_fft = 2 ** (2 * frame_length - 1).bit_length()
    fft_frames = torch.fft.rfft(frames, n=n_fft, dim=-1)
    power = torch.abs(fft_frames) ** 2
    autocorr = torch.fft.irfft(power, n=n_fft, dim=-1)[:, :frame_length]

    # Difference function d(tau) = r(0) + r_tau(0) - 2*r(tau)
    sq_frames = frames ** 2
    cum_energy = torch.cumsum(sq_frames.flip(-1), dim=-1).flip(-1)
    d = cum_energy[:, :1] + cum_energy - 2 * autocorr

    # Cumulative Mean Normalized Difference Function (CMNDF)
    tau_range = torch.arange(1, frame_length, device=DEVICE, dtype=d.dtype)
    cum_sum = torch.cumsum(d[:, 1:], dim=-1)
    cmndf = (d[:, 1:] * tau_range) / torch.clamp(cum_sum, min=1e-12)
    ones = torch.ones((num_frames, 1), device=DEVICE, dtype=d.dtype)
    cmndf = torch.cat([ones, cmndf], dim=-1)

    tau_min = max(1, int(TARGET_SR / F0_MAX_HZ))
    tau_max = min(frame_length - 1, int(TARGET_SR / F0_MIN_HZ))

    if tau_min >= tau_max:
        return torch.empty(0, device=DEVICE), 0.0, float("nan")

    cmndf_search = cmndf[:, tau_min:tau_max + 1]
    best_tau_idx = torch.argmin(cmndf_search, dim=-1)
    best_cmndf_val = torch.gather(cmndf_search, 1, best_tau_idx.unsqueeze(-1)).squeeze(-1)

    best_tau = (best_tau_idx + tau_min).float()
    f0 = TARGET_SR / best_tau

    voiced_mask = (best_cmndf_val < 0.25) & (f0 > F0_MIN_HZ + 2.0) & (f0 < F0_MAX_HZ - 5.0)
    voiced_f0 = f0[voiced_mask]

    ratio = float(voiced_mask.float().mean().item()) if voiced_mask.numel() else 0.0
    median = float(torch.median(voiced_f0).item()) if voiced_f0.numel() > 0 else float("nan")

    return voiced_f0, ratio, median

def analyze_audio_tensor(waveform: torch.Tensor) -> tuple[torch.Tensor, list[dict], dict]:
    """
    Analyzes waveform CUDA tensor completely on GPU.
    RMS, HNR, and YIN Pitch Tracking execute 100% on CUDA VRAM.
    """
    if waveform.shape[0] < TARGET_SR * 5:
        raise ValueError(
            f"Audio is only {waveform.shape[0] / TARGET_SR:.1f}s; "
            f"at least 5s is required."
        )

    waveform = torch.nan_to_num(waveform, nan=0.0, posinf=0.0, neginf=0.0)
    waveform = torch.clamp(waveform, -1.0, 1.0)

    accepted = []
    segment_pitch_medians = []
    absolute_f0_min = float("inf")
    absolute_f0_max = float("-inf")

    win_samples = min(waveform.shape[0], SEGMENT_SAMPLES)
    hop = min(win_samples, HOP_SAMPLES)

    for start in range(0, max(1, waveform.shape[0] - win_samples + 1), hop):
        end = min(start + win_samples, waveform.shape[0])
        segment_gpu = waveform[start:end]
        if segment_gpu.shape[0] < TARGET_SR * 3:
            continue

        energy = rms_dbfs_gpu(segment_gpu)
        if energy < MIN_RMS_DBFS:
            continue

        harmonic_noise_ratio = hnr_db_gpu(segment_gpu)
        if harmonic_noise_ratio < MIN_HNR_DB:
            continue

        # Candidate segment passed GPU energy & GPU HNR filters; run 100% PyTorch GPU YIN
        voiced_f0, voiced_ratio, median_f0 = extract_f0_gpu(segment_gpu)
        if voiced_ratio < MIN_VOICED_RATIO or not math.isfinite(median_f0):
            continue

        accepted.append({
            "start": int(start),
            "end": int(end),
            "rms_dbfs": round(energy, 3),
            "hnr_db": round(harmonic_noise_ratio, 3),
            "voiced_ratio": round(voiced_ratio, 4),
            "median_f0_hz": round(median_f0, 3),
        })

        segment_pitch_medians.append(median_f0)
        min_v = float(torch.min(voiced_f0).item())
        max_v = float(torch.max(voiced_f0).item())
        absolute_f0_min = min(absolute_f0_min, min_v)
        absolute_f0_max = max(absolute_f0_max, max_v)

    if not accepted:
        raise ValueError("No segment passed RMS, HNR, and voiced-pitch filters.")

    pitch_medians = np.asarray(segment_pitch_medians, dtype=np.float32)
    f0_summary = {
        "observed_min_hz": round(float(absolute_f0_min), 3),
        "observed_max_hz": round(float(absolute_f0_max), 3),
        "robust_floor_hz_p05": round(float(np.percentile(pitch_medians, 5)), 3),
        "robust_center_hz_median": round(float(np.median(pitch_medians)), 3),
        "robust_ceiling_hz_p95": round(float(np.percentile(pitch_medians, 95)), 3),
    }

    # Manual glibc heap trim for long-running batch crawl processes
    ctypes.CDLL("libc.so.6").malloc_trim(0)

    return waveform, accepted, f0_summary


# =============================================================================
# Register selection and WavLM embedding
# =============================================================================

def choose_register_segments(accepted: list[dict]) -> dict[str, list[dict]]:
    """
    Select:
      - Deep bass: lowest 5% by stable segment median F0.
      - Dynamic climax: highest 5% by F0, only with stronger HNR.
      - Baseline: segments nearest the overall median F0.

    At least one segment is selected per tier. For small sources, tiers may
    overlap; that fact is represented by their source segment metadata.
    """
    count_per_tier = max(1, math.ceil(len(accepted) * 0.05))
    by_pitch = sorted(accepted, key=lambda item: item["median_f0_hz"])

    deep_bass = by_pitch[:count_per_tier]

    high_purity = [
        item for item in by_pitch
        if item["hnr_db"] >= MIN_CLIMAX_HNR_DB
    ]
    if not high_purity:
        # Fallback to the top highest pitch segments if strict climax HNR requirement isn't met
        high_purity = sorted(by_pitch, key=lambda item: (item["median_f0_hz"], item["hnr_db"]))
    dynamic_climax = high_purity[-count_per_tier:]

    center_pitch = float(np.median([item["median_f0_hz"] for item in accepted]))
    baseline_anchor = sorted(
        accepted,
        key=lambda item: abs(item["median_f0_hz"] - center_pitch),
    )[:count_per_tier]

    return {
        "deep_bass": deep_bass,
        "dynamic_climax": dynamic_climax,
        "baseline_anchor": baseline_anchor,
    }

@torch.inference_mode()
def embed_waveforms_gpu(clips: list[torch.Tensor]) -> tuple[list[np.ndarray], list[np.ndarray]]:
    """
    Extracts WavLM embeddings directly from PyTorch CUDA Tensors.
    Eliminates CPU AutoFeatureExtractor allocations and CPU RAM bloat.
    """
    contextual_768 = []
    native_sv = []

    for batch_start in range(0, len(clips), MAX_GPU_BATCH_SIZE):
        batch_tensors = clips[batch_start:batch_start + MAX_GPU_BATCH_SIZE]
        max_len = max(c.shape[0] for c in batch_tensors)

        padded_batch = torch.zeros((len(batch_tensors), max_len), device=DEVICE, dtype=torch.float32)
        attn_mask = torch.zeros((len(batch_tensors), max_len), device=DEVICE, dtype=torch.long)

        for i, c in enumerate(batch_tensors):
            padded_batch[i, :c.shape[0]] = c
            attn_mask[i, :c.shape[0]] = 1

        mean = padded_batch.mean(dim=-1, keepdim=True)
        std = padded_batch.std(dim=-1, keepdim=True) + 1e-7
        norm_batch = (padded_batch - mean) / std

        inputs = {
            "input_values": norm_batch,
            "attention_mask": attn_mask,
        }

        outputs = MODEL(
            **inputs,
            output_hidden_states=True,
            return_dict=True,
        )

        hidden = outputs.hidden_states[-1]
        if hidden.shape[-1] != 768:
            raise RuntimeError(
                f"Expected 768 hidden dimensions, got {hidden.shape[-1]}."
            )

        try:
            feature_mask = MODEL.wavlm._get_feature_vector_attention_mask(
                hidden.shape[1],
                attn_mask,
            )
        except Exception:
            feature_mask = torch.ones(
                hidden.shape[:2],
                dtype=torch.bool,
                device=hidden.device,
            )

        weights = feature_mask.unsqueeze(-1).to(hidden.dtype)
        pooled = (hidden * weights).sum(dim=1) / weights.sum(dim=1).clamp(min=1.0)
        pooled = F.normalize(pooled, p=2, dim=-1)

        native = F.normalize(outputs.embeddings, p=2, dim=-1)

        contextual_768.extend(pooled.detach().cpu().numpy())
        native_sv.extend(native.detach().cpu().numpy())

        del padded_batch, attn_mask, norm_batch, inputs, outputs, hidden, weights, pooled, native
        torch.cuda.empty_cache()

    return contextual_768, native_sv

def mean_embedding(vectors: list[np.ndarray]) -> list:
    if not vectors:
        raise ValueError("Cannot average an empty embedding set.")
    return l2_normalized_list(np.mean(np.stack(vectors, axis=0), axis=0))

def build_profile_embeddings(
    waveform: torch.Tensor,
    register_segments: dict[str, list[dict]],
) -> dict:
    """
    Extract target CUDA sub-tensors directly on GPU without CPU numpy copies.
    """
    unique_windows = {}
    for entries in register_segments.values():
        for entry in entries:
            unique_windows[(entry["start"], entry["end"])] = entry

    window_keys = list(unique_windows.keys())
    clips = [
        waveform[start:end]
        for start, end in window_keys
    ]

    contextual_vectors, native_vectors = embed_waveforms_gpu(clips)

    vectors_by_window = {
        key: {
            "contextual_768": contextual_vectors[index],
            "native_sv": native_vectors[index],
        }
        for index, key in enumerate(window_keys)
    }

    register_embeddings_768 = {}
    native_speaker_embeddings = {}
    register_source_segments = {}

    for register_name, entries in register_segments.items():
        selected_contextual = []
        selected_native = []
        metadata = []

        for entry in entries:
            key = (entry["start"], entry["end"])
            selected_contextual.append(vectors_by_window[key]["contextual_768"])
            selected_native.append(vectors_by_window[key]["native_sv"])
            metadata.append({
                "start_seconds": round(entry["start"] / TARGET_SR, 3),
                "end_seconds": round(entry["end"] / TARGET_SR, 3),
                "median_f0_hz": entry["median_f0_hz"],
                "hnr_db": entry["hnr_db"],
                "rms_dbfs": entry["rms_dbfs"],
                "voiced_ratio": entry["voiced_ratio"],
            })

        register_embeddings_768[register_name] = mean_embedding(selected_contextual)
        native_speaker_embeddings[register_name] = mean_embedding(selected_native)
        register_source_segments[register_name] = metadata

    return {
        "register_embeddings_768": register_embeddings_768,
        "native_speaker_embeddings": native_speaker_embeddings,
        "native_speaker_embedding_dimension": len(native_speaker_embeddings["baseline_anchor"]),
        "register_source_segments": register_source_segments,
    }


def merge_surah_profiles(surah_results: list[dict]) -> dict:
    """Average per-Surah register embeddings into one Qari-level profile."""
    if not surah_results:
        raise ValueError("No Surah produced valid register embeddings.")

    tiers = ("deep_bass", "baseline_anchor", "dynamic_climax")

    merged_768 = {}
    merged_native = {}
    merged_sources = {}

    for tier in tiers:
        vectors_768 = [
            np.asarray(item["embeddings"]["register_embeddings_768"][tier], dtype=np.float32)
            for item in surah_results
        ]
        vectors_native = [
            np.asarray(item["embeddings"]["native_speaker_embeddings"][tier], dtype=np.float32)
            for item in surah_results
        ]

        merged_768[tier] = l2_normalized_list(np.mean(np.stack(vectors_768), axis=0))
        merged_native[tier] = l2_normalized_list(np.mean(np.stack(vectors_native), axis=0))

        source_metadata = []
        for item in surah_results:
            for segment in item["embeddings"]["register_source_segments"][tier]:
                source_metadata.append({
                    "surah_number": item["surah_number"],
                    "source_url": item["source_url"],
                    **segment,
                })
        merged_sources[tier] = source_metadata

    floors = [item["f0_summary"]["robust_floor_hz_p05"] for item in surah_results]
    centers = [item["f0_summary"]["robust_center_hz_median"] for item in surah_results]
    ceilings = [item["f0_summary"]["robust_ceiling_hz_p95"] for item in surah_results]

    f0_summary = {
        "observed_min_hz": round(min(item["f0_summary"]["observed_min_hz"] for item in surah_results), 3),
        "observed_max_hz": round(max(item["f0_summary"]["observed_max_hz"] for item in surah_results), 3),
        "robust_floor_hz_p05": round(float(np.median(floors)), 3),
        "robust_center_hz_median": round(float(np.median(centers)), 3),
        "robust_ceiling_hz_p95": round(float(np.median(ceilings)), 3),
    }

    return {
        "register_embeddings_768": merged_768,
        "native_speaker_embeddings": merged_native,
        "native_speaker_embedding_dimension": len(merged_native["baseline_anchor"]),
        "register_source_segments": merged_sources,
        "f0_summary": f0_summary,
    }


class QariAccumulator:
    """
    Online GPU running-average accumulator to prevent System RAM bloat.
    Maintains running sums of register embeddings on GPU CUDA tensors instead of
    storing thousands of Python list dictionaries in CPU memory.
    """
    def __init__(self):
        self.tiers = ("deep_bass", "baseline_anchor", "dynamic_climax")
        self.running_768 = {t: None for t in self.tiers}
        self.running_native = {t: None for t in self.tiers}
        self.counts = {t: 0 for t in self.tiers}
        self.source_segments = {t: [] for t in self.tiers}
        self.floors = []
        self.centers = []
        self.ceilings = []
        self.obs_mins = []
        self.obs_maxs = []

    def add_clip_result(self, surah_number: int, source_url: str, f0_summary: dict, embeddings: dict) -> None:
        emb = embeddings
        for t in self.tiers:
            v_768 = torch.tensor(emb["register_embeddings_768"][t], device=DEVICE, dtype=torch.float32)
            v_nat = torch.tensor(emb["native_speaker_embeddings"][t], device=DEVICE, dtype=torch.float32)

            if self.running_768[t] is None:
                self.running_768[t] = v_768
                self.running_native[t] = v_nat
            else:
                self.running_768[t] += v_768
                self.running_native[t] += v_nat
            self.counts[t] += 1

            if len(self.source_segments[t]) < 10:
                for seg in emb["register_source_segments"][t]:
                    self.source_segments[t].append({
                        "surah_number": surah_number,
                        "source_url": source_url,
                        **seg,
                    })

        self.floors.append(f0_summary["robust_floor_hz_p05"])
        self.centers.append(f0_summary["robust_center_hz_median"])
        self.ceilings.append(f0_summary["robust_ceiling_hz_p95"])
        self.obs_mins.append(f0_summary["observed_min_hz"])
        self.obs_maxs.append(f0_summary["observed_max_hz"])

    def has_data(self) -> bool:
        return any(cnt > 0 for cnt in self.counts.values())

    def finalize(self) -> dict:
        if not self.has_data():
            raise ValueError("No clip produced valid register embeddings.")

        merged_768 = {}
        merged_native = {}

        for t in self.tiers:
            cnt = float(max(1, self.counts[t]))
            avg_768 = self.running_768[t] / cnt
            avg_nat = self.running_native[t] / cnt

            norm_768 = F.normalize(avg_768, p=2, dim=0).cpu().numpy().tolist()
            norm_nat = F.normalize(avg_nat, p=2, dim=0).cpu().numpy().tolist()

            merged_768[t] = norm_768
            merged_native[t] = norm_nat

        f0_summary = {
            "observed_min_hz": round(min(self.obs_mins), 3),
            "observed_max_hz": round(max(self.obs_maxs), 3),
            "robust_floor_hz_p05": round(float(np.median(self.floors)), 3),
            "robust_center_hz_median": round(float(np.median(self.centers)), 3),
            "robust_ceiling_hz_p95": round(float(np.median(self.ceilings)), 3),
        }

        return {
            "register_embeddings_768": merged_768,
            "native_speaker_embeddings": merged_native,
            "native_speaker_embedding_dimension": len(merged_native["baseline_anchor"]),
            "register_source_segments": self.source_segments,
            "f0_summary": f0_summary,
        }


# =============================================================================
# Warm-load model once, then run the isolated Qari loop
# =============================================================================

print(f"Loading {MODEL_NAME} onto {DEVICE}...")

PROCESSOR = AutoFeatureExtractor.from_pretrained(MODEL_NAME)
MODEL = WavLMForXVector.from_pretrained(MODEL_NAME).to(DEVICE)
MODEL.eval()

torch.backends.cuda.matmul.allow_tf32 = True
print("Model loaded. Starting dynamic Qari registry crawl.")

try:
    qari_registry = discover_qari_cards()
except Exception as exc:
    raise RuntimeError(
        f"Could not crawl the Qari registry at {BASE_URL}: "
        f"{type(exc).__name__}: {exc}"
    ) from exc

print(f"Discovered {len(qari_registry)} Qari cards.")

completed_this_run = 0
skipped_existing = 0
failed = 0

if "qari_is_complete" not in globals() or "LEDGER" not in globals():
    raise RuntimeError(
        "Cell 2 has not been run yet! Please run Cell 2 first to mount Google Drive "
        "and load the ledger before running Cell 3."
    )

for index, qari in enumerate(qari_registry, start=1):
    qari_name = qari["name"]
    qari_id = qari["qari_id"]
    profile_url = qari["profile_url"]
    workspace_dir = None

    if qari_is_complete(qari_id):
        skipped_existing += 1
        print(f"[{index}/{len(qari_registry)}] SKIP complete: {qari_name}")
        continue

    print(f"\n[{index}/{len(qari_registry)}] PROCESS: {qari_name}")
    try:
        # The safe folder remains explicitly based on the Qari's visible name.
        workspace_dir = SCRATCH_ROOT / safe_folder_name(qari_name)

        # Remove only a stale workspace for this exact Qari, then start clean.
        if workspace_dir.exists():
            shutil.rmtree(workspace_dir, ignore_errors=True)
        workspace_dir.mkdir(parents=True, exist_ok=False)

        clips_dir = workspace_dir / "clips"
        clips_dir.mkdir(parents=True, exist_ok=True)

        surah_sources, source_mode = discover_surah_sources(profile_url)

        if not surah_sources:
            raise ValueError("No individual Surah MP3 links were found.")

        print(
            f"  Source mode: {source_mode}. "
            f"Processing {len(surah_sources)} Surah file(s)..."
        )

        accumulator = QariAccumulator()
        failed_surahs = 0
        total_clips_processed = 0
        total_audio_seconds_processed = 0.0

        for source_index, source in enumerate(surah_sources, start=1):
            if total_audio_seconds_processed >= MAX_QARI_AUDIO_SECONDS:
                print(
                    f"  ✓ Hard cap reached: {total_audio_seconds_processed / 60:.1f} mins "
                    f"processed for {qari_name}. Stopping further Surah downloads."
                )
                break

            surah_number = source["surah_number"]
            display_number = f"{surah_number:03d}" if surah_number != 999 else f"#{source_index}"
            raw_audio_path = workspace_dir / f"surah_{display_number}_raw.mp3"

            try:
                print(
                    f"    [{source_index}/{len(surah_sources)}] "
                    f"Surah {display_number}: download → decode directly to GPU CUDA tensor & slice in-memory → parse clips"
                )

                download_single_audio(source["url"], raw_audio_path)

                # Decode audio directly onto GPU CUDA tensor
                surah_tensor = load_audio_16k_mono_gpu(raw_audio_path)

                # Delete raw MP3 immediately after decoding
                if raw_audio_path.exists():
                    raw_audio_path.unlink()

                clip_samples = TARGET_SR * CLIP_SECONDS
                total_samples = surah_tensor.shape[0]
                clip_starts = list(range(0, total_samples, clip_samples))

                for clip_index, start_idx in enumerate(clip_starts, start=1):
                    if total_audio_seconds_processed >= MAX_QARI_AUDIO_SECONDS:
                        print(
                            f"        Hard cap reached ({total_audio_seconds_processed / 60:.1f} mins). "
                            f"Stopping further clips for Surah {display_number}."
                        )
                        break

                    end_idx = min(start_idx + clip_samples, total_samples)
                    clip_len = end_idx - start_idx
                    if clip_len < TARGET_SR * 5:
                        continue

                    clip_tensor = surah_tensor[start_idx:end_idx]

                    try:
                        waveform_gpu, accepted_segments, f0_summary = analyze_audio_tensor(clip_tensor)
                        register_segments = choose_register_segments(accepted_segments)
                        embeddings = build_profile_embeddings(waveform_gpu, register_segments)

                        accumulator.add_clip_result(
                            surah_number=surah_number,
                            source_url=source["url"],
                            f0_summary=f0_summary,
                            embeddings=embeddings,
                        )
                        total_clips_processed += 1
                        total_audio_seconds_processed += (clip_len / TARGET_SR)

                        del waveform_gpu, accepted_segments, register_segments, embeddings

                    except Exception as clip_exc:
                        print(f"        Clip {clip_index} skipped: {type(clip_exc).__name__}: {clip_exc}")
                    finally:
                        del clip_tensor

                del surah_tensor

            except Exception as exc:
                failed_surahs += 1
                print(f"      Surah skipped safely: {type(exc).__name__}: {exc}")

            finally:
                if raw_audio_path.exists():
                    raw_audio_path.unlink()

                gc.collect()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                trim_system_ram()

        # A Qari is only written after at least one clip generated all profiles.
        merged = accumulator.finalize()

        record = {
            "completed": True,
            "qari_name": qari_name,
            "qari_id": qari_id,
            "source_profile_url": profile_url,
            "source_mode": source_mode,
            "processed_at_utc": utc_now(),
            "audio_processing": {
                "sample_rate_hz": TARGET_SR,
                "channels": 1,
                "clip_seconds": CLIP_SECONDS,
                "max_audio_minutes_cap": MAX_QARI_AUDIO_SECONDS // 60,
                "total_audio_seconds_processed": round(total_audio_seconds_processed, 2),
                "rms_threshold_dbfs": MIN_RMS_DBFS,
                "hnr_threshold_db": MIN_HNR_DB,
                "climax_hnr_threshold_db": MIN_CLIMAX_HNR_DB,
                "surahs_discovered": len(surah_sources),
                "total_clips_processed": total_clips_processed,
                "surahs_skipped": failed_surahs,
            },
            "f0_pitch_boundaries_hz": merged.pop("f0_summary"),
            **merged,
        }

        commit_qari_record(qari_id, record)
        completed_this_run += 1
        print("  ✓ Ledger committed to Google Drive.")

        del accumulator, merged, record

    except Exception as exc:
        failed += 1
        print(f"  ✗ Skipped safely: {type(exc).__name__}: {exc}")

    finally:
        # CLEANSE RULE: after every Qari, delete its complete local workspace,
        # then explicitly release Python RAM and CUDA allocator caches.
        if workspace_dir is not None and workspace_dir.exists():
            shutil.rmtree(workspace_dir, ignore_errors=True)

        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()

print("\n" + "=" * 72)
print("Conveyor run complete.")
print(f"Newly completed: {completed_this_run}")
print(f"Already complete: {skipped_existing}")
print(f"Skipped/errors:    {failed}")
print(f"Persistent ledger: {LEDGER_PATH}")
print("=" * 72)