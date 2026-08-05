import io
import json
import sys
import tempfile
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
import torch
import torchaudio
import torch.nn.functional as F
from transformers import AutoFeatureExtractor, AutoModelForAudioXVector
from sklearn.metrics.pairwise import cosine_similarity

# Prevent UnicodeEncodeError on Windows terminals when printing paths with special characters like 'ā'
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="backslashreplace")
    except (AttributeError, OSError):
        pass


class VoiceMatcher:
    def __init__(
        self,
        model_name: str = "microsoft/wavlm-base-plus-sv",
        vector_db_path: str = "data/vector_db.json",
    ):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Loading WavLM SV model ({model_name}) on device: {self.device}...")
        self.feature_extractor = AutoFeatureExtractor.from_pretrained(model_name)
        self.model = AutoModelForAudioXVector.from_pretrained(model_name).to(self.device)
        self.model.eval()

        db_file = Path(vector_db_path)
        if not db_file.is_absolute():
            # Resolve path relative to backend root directory
            backend_dir = Path(__file__).resolve().parent.parent
            candidate = backend_dir / vector_db_path
            if candidate.exists():
                db_file = candidate

        print(f"Loading vector database from {str(db_file)}...")
        with db_file.open("r", encoding="utf-8") as f:
            self.db_dict = json.load(f)

        self.qari_names = list(self.db_dict.keys())
        matrix_list = [self.db_dict[name] for name in self.qari_names]
        self.qari_matrix = np.array(matrix_list, dtype=np.float32)

        # L2-normalize stored Qari vectors for cosine similarity computation
        norms = np.linalg.norm(self.qari_matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1e-12
        self.qari_matrix = self.qari_matrix / norms

        print(
            f"VoiceMatcher initialized: {len(self.qari_names)} Qaris in memory, "
            f"matrix shape {self.qari_matrix.shape}."
        )

    def process_audio(self, file_bytes: bytes, filename: str = "") -> np.ndarray:
        """
        Universal audio ingestion: accepts ALL audio formats (.wav, .mp3, .m4a, .ogg,
        .flac, .webm, .aac, .opus, .wma, .amr, .aiff, etc.) and converts them into a
        standardized 16,000 Hz Mono float32 numpy array.
        """
        if not file_bytes:
            raise ValueError("Uploaded file bytes are empty.")

        # Stage 0: Fast & robust FFmpeg decoding via imageio_ffmpeg (supports .webm, .mp3, .m4a, .wav, etc.)
        try:
            import subprocess
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            cmd = [
                ffmpeg_exe,
                "-i", "pipe:0",
                "-f", "s16le",
                "-acodec", "pcm_s16le",
                "-ar", "16000",
                "-ac", "1",
                "pipe:1"
            ]
            proc = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            out, _ = proc.communicate(input=file_bytes)
            if proc.returncode == 0 and len(out) > 0:
                audio_int16 = np.frombuffer(out, dtype=np.int16)
                if len(audio_int16) > 0:
                    return audio_int16.astype(np.float32) / 32768.0
        except Exception:
            pass

        # Stage 1: In-memory librosa load
        try:
            audio_stream = io.BytesIO(file_bytes)
            waveform, _ = librosa.load(audio_stream, sr=16000, mono=True, dtype=np.float32)
            if waveform.size > 0:
                return waveform
        except Exception:
            pass

        # Stage 2: In-memory soundfile load
        try:
            audio_stream = io.BytesIO(file_bytes)
            data, sr = sf.read(audio_stream, dtype="float32")
            if data.size > 0:
                if data.ndim > 1:
                    data = np.mean(data, axis=1)
                if sr != 16000:
                    data = librosa.resample(data, orig_sr=sr, target_sr=16000)
                return data.astype(np.float32)
        except Exception:
            pass

        # Stage 3: Tempfile fallback for complex wrappers (.m4a, .webm, .aac, .opus, .wma)
        ext = Path(filename).suffix if filename else ".audio"
        if not ext.startswith("."):
            ext = f".{ext}"

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = Path(tmp.name)

        try:
            # 3a. Torchaudio decoder
            try:
                tensor, sr = torchaudio.load(str(tmp_path))
                if tensor.numel() > 0:
                    if tensor.shape[0] > 1:
                        tensor = torch.mean(tensor, dim=0, keepdim=True)
                    tensor = tensor.squeeze(0)
                    if sr != 16000:
                        tensor = torchaudio.functional.resample(
                            tensor, orig_freq=sr, new_freq=16000
                        )
                    return tensor.cpu().numpy().astype(np.float32)
            except Exception:
                pass

            # 3b. Librosa path decoder
            waveform, _ = librosa.load(str(tmp_path), sr=16000, mono=True, dtype=np.float32)
            if waveform.size > 0:
                return waveform

            raise ValueError("Audio recording format could not be decoded.")
        finally:
            if tmp_path.exists():
                try:
                    tmp_path.unlink()
                except Exception:
                    pass


    @torch.no_grad()
    def extract_embedding(self, audio_array: np.ndarray) -> np.ndarray:
        """
        Passes 16kHz mono audio array through WavLM SV model to extract the speaker x-vector.
        Returns a normalized 1D numpy array.
        """
        inputs = self.feature_extractor(
            audio_array, sampling_rate=16000, return_tensors="pt"
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        outputs = self.model(**inputs)
        embeddings = outputs.embeddings
        embeddings = F.normalize(embeddings, p=2, dim=-1)

        embedding_np = embeddings.squeeze(0).cpu().numpy().astype(np.float32)
        return embedding_np

    def find_match(self, user_embedding: np.ndarray, top_k: int = 3) -> list[dict]:
        """
        Computes cosine similarity between user embedding and pre-stored Qari matrix.
        Returns top_k matches as a list of dicts: [{'qari': name, 'confidence': float}].
        """
        user_vector = user_embedding.reshape(1, -1)
        # Compute cosine similarity
        similarities = cosine_similarity(user_vector, self.qari_matrix)[0]

        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            # Confidence score rounded to 4 decimals
            confidence = round(max(0.0, min(1.0, score)), 4)
            results.append({
                "qari": self.qari_names[idx],
                "confidence": confidence
            })

        return results
