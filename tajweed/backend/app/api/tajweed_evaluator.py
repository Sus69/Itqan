import numpy as np
import librosa
import logging

logger = logging.getLogger(__name__)

def evaluate_recitation(cleaned_audio: np.ndarray, expected_bounds: dict) -> dict:
    """
    Evaluates a preprocessed recitation against acoustic expected bounds.
    Returns:
        dict: A report containing pass/fail flags, raw metrics, and comparison scores.
    """
    sr = 16000
    report = {
        "overall_pass": True,
        "metrics": {},
        "details": {}
    }
    
    # Calculate active duration in seconds
    active_duration = len(cleaned_audio) / float(sr)
    report["metrics"]["active_duration_seconds"] = round(active_duration, 3)
    
    # 1. Duration Metric Evaluation
    duration_metric = expected_bounds.get("duration_metric", {})
    if duration_metric:
        metric_type = duration_metric.get("type")
        min_duration = duration_metric.get("minimum_duration_seconds", 0.0)
        tolerance = duration_metric.get("mathematical_tolerance_seconds", 0.0)
        
        # Check active speech duration
        duration_pass = True
        lower_bound = max(0.0, min_duration - tolerance)
        
        if active_duration < lower_bound:
            duration_pass = False
            report["overall_pass"] = False
            
        report["details"]["duration"] = {
            "type": metric_type,
            "pass": duration_pass,
            "measured": round(active_duration, 3),
            "expected_minimum": min_duration,
            "tolerance": tolerance,
            "status": "compliant" if duration_pass else "too_short"
        }

    # 2. Spectral Metric Evaluation
    spectral_metric = expected_bounds.get("spectral_metric", {})
    if spectral_metric and len(cleaned_audio) > 100:
        metric_type = spectral_metric.get("type")
        expected_state = spectral_metric.get("expected_state")
        centroid_ceiling = spectral_metric.get("centroid_ceiling_hz")
        
        # Compute spectral centroid
        try:
            centroids = librosa.feature.spectral_centroid(y=cleaned_audio, sr=sr)
            avg_centroid = float(np.mean(centroids))
        except Exception as e:
            logger.error(f"Error computing spectral centroid: {e}")
            avg_centroid = 0.0
            
        report["metrics"]["spectral_centroid_hz"] = round(avg_centroid, 2)
        
        spectral_pass = True
        status = "compliant"
        
        # Check tongue retraction (Tafkhim) - characterized by retracted tongue root, lower centroid
        if expected_state == "heavy_retracted_tongue_root" and centroid_ceiling:
            if avg_centroid > centroid_ceiling:
                spectral_pass = False
                report["overall_pass"] = False
                status = "insufficient_velarization_high_centroid"
                
        # Check nasal resonance (Ghunnah)
        elif expected_state == "nasal_resonance":
            # Compute nasal energy ratio: energy in 2000Hz - 3500Hz band
            try:
                fft_vals = np.abs(np.fft.rfft(cleaned_audio))
                freqs = np.fft.rfftfreq(len(cleaned_audio), 1.0/sr)
                nasal_mask = (freqs >= 2000) & (freqs <= 3500)
                nasal_energy = np.sum(fft_vals[nasal_mask] ** 2)
                total_energy = np.sum(fft_vals ** 2)
                nasal_ratio = float(nasal_energy / total_energy) if total_energy > 0 else 0.0
            except Exception as e:
                logger.error(f"Error computing FFT for Ghunnah: {e}")
                nasal_ratio = 0.0
                
            report["metrics"]["nasal_resonance_ratio"] = round(nasal_ratio, 4)
            # Standard threshold for nasal ratio in normal phonation vs nasal hum
            if nasal_ratio < 0.015:
                spectral_pass = False
                report["overall_pass"] = False
                status = "insufficient_nasalisation"
                
        report["details"]["spectral"] = {
            "type": metric_type,
            "expected_state": expected_state,
            "pass": spectral_pass,
            "measured_centroid_hz": round(avg_centroid, 2),
            "centroid_ceiling_hz": centroid_ceiling,
            "status": status
        }
    else:
        # Default or fallback if audio is too short to compute spectral features
        report["details"]["spectral"] = {
            "pass": True,
            "status": "skipped_insufficient_audio"
        }
        
    return report


def check_proper_stop(audio: np.ndarray, sr: int, t_end: float) -> tuple[bool, float]:
    """
    Measures RMS energy decay profile in a 100ms window following t_end.
    """
    start_idx = int(t_end * sr)
    end_idx = start_idx + int(0.1 * sr)  # 100ms
    if start_idx >= len(audio):
        return True, -100.0
    segment = audio[start_idx:end_idx]
    if len(segment) == 0:
        return True, -100.0
    mean_sq = np.mean(segment ** 2)
    rms_db = 10.0 * np.log10(mean_sq + 1e-10)
    return rms_db < -45.0, float(rms_db)


def check_pitch_stability(segment: np.ndarray, sr: int) -> float:
    """
    Computes standard deviation of pitch divided by mean pitch (coefficient of variation).
    """
    if len(segment) < 256:
        return 0.0
    try:
        fmin = 60
        fmax = 400
        # Compute pitch using YIN
        pitches = librosa.yin(y=segment, sr=sr, fmin=fmin, fmax=fmax)
        valid_pitches = pitches[pitches > fmin]
        if len(valid_pitches) < 2:
            return 0.0
        std_dev = np.std(valid_pitches)
        mean_val = np.mean(valid_pitches)
        if mean_val == 0:
            return 0.0
        return float(std_dev / mean_val)
    except Exception as e:
        logger.error(f"Error computing pitch stability: {e}")
        return 0.0


def check_ghunnah(segment: np.ndarray, sr: int) -> tuple[bool, float, float]:
    """
    Computes STFT frames to verify the nasal energy ratio in [200Hz - 2000Hz] is >= 0.65
    sustained for >= 800ms.
    """
    n_fft = 512
    hop_length = 128
    
    if len(segment) < n_fft:
        return False, 0.0, 0.0
        
    stft_matrix = np.abs(librosa.stft(segment, n_fft=n_fft, hop_length=hop_length))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
    nasal_mask = (freqs >= 200) & (freqs <= 2000)
    
    ratios = []
    sustained_frames = 0
    max_sustained_duration = 0.0
    
    for col in range(stft_matrix.shape[1]):
        frame_energies = stft_matrix[:, col] ** 2
        total_energy = np.sum(frame_energies)
        
        if total_energy == 0:
            ratio = 0.0
        else:
            nasal_energy = np.sum(frame_energies[nasal_mask])
            ratio = nasal_energy / total_energy
            
        ratios.append(ratio)
        
        if ratio >= 0.65:
            sustained_frames += 1
        else:
            dur = (sustained_frames * hop_length) / float(sr)
            if dur > max_sustained_duration:
                max_sustained_duration = dur
            sustained_frames = 0
            
    dur = (sustained_frames * hop_length) / float(sr)
    if dur > max_sustained_duration:
        max_sustained_duration = dur
        
    avg_ratio = float(np.mean(ratios)) if ratios else 0.0
    return max_sustained_duration >= 0.8, max_sustained_duration, avg_ratio


def check_qalqalah_bounce(segment: np.ndarray, sr: int) -> tuple[bool, dict]:
    """
    Checks the amplitude envelope of a consonant for occlusion drop and secondary echo bounce.
    """
    win_len = int(0.005 * sr)  # 5ms sliding window
    hop_len = win_len // 2
    
    if len(segment) <= win_len:
        return False, {"error": "Segment too short"}
        
    envelope = np.array([np.max(np.abs(segment[i:i+win_len])) for i in range(0, len(segment) - win_len, hop_len)])
    if len(envelope) < 6:
        return False, {"error": "Envelope too short"}
        
    # Primary peak
    primary_idx = int(np.argmax(envelope))
    primary_val = envelope[primary_idx]
    
    # 15ms is 15 / 2.5 = 6 index steps
    steps_15ms = int(0.015 / (hop_len / float(sr)))
    
    # Occlusion drop within 15ms
    post_peak = envelope[primary_idx + 1: primary_idx + steps_15ms + 1]
    if len(post_peak) == 0:
        return False, {"error": "No data after primary peak"}
        
    min_idx_relative = int(np.argmin(post_peak))
    min_idx = primary_idx + 1 + min_idx_relative
    min_val = envelope[min_idx]
    
    # Check drop to <= 15% of primary peak height
    is_dropped = min_val < 0.15 * primary_val
    
    # Secondary bounce spike after drop
    post_drop = envelope[min_idx + 1:]
    if len(post_drop) == 0:
        return False, {"error": "No data after occlusion drop"}
        
    secondary_idx_relative = int(np.argmax(post_drop))
    secondary_idx = min_idx + 1 + secondary_idx_relative
    secondary_val = envelope[secondary_idx]
    
    ratio = secondary_val / primary_val if primary_val > 0 else 0.0
    # Secondary peak height between 20% and 40%
    is_bounced = 0.20 <= ratio <= 0.40
    
    passed = is_dropped and is_bounced
    return passed, {
        "primary_peak": float(primary_val),
        "drop_value": float(min_val),
        "secondary_peak": float(secondary_val),
        "ratio": float(ratio),
        "drop_duration_ms": float(min_idx_relative * (hop_len / float(sr)) * 1000.0)
    }


def cast_to_python(obj):
    if isinstance(obj, dict):
        return {k: cast_to_python(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [cast_to_python(x) for x in obj]
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.floating, float)):
        return float(obj)
    return obj


def evaluate_rule_dsp(audio: np.ndarray, sr: int, segments: list, rule_mask: str) -> dict:
    """
    Unified entrypoint to apply mathematical DSP rules over aligned sub-arrays.
    """
    report = {
        "rule_mask": rule_mask,
        "pass": True,
        "metrics": {},
        "details": {}
    }
    
    if not segments:
        # Fallback if alignment failed: evaluate overall audio as a single chunk
        logger.warning(f"No forced-alignment segments for rule {rule_mask}. Falling back to overall audio evaluation.")
        segments = [{"char": "*", "start": 0.0, "end": len(audio) / float(sr)}]
        
    # Find relevant segments based on rule
    if rule_mask == "qalqalah_with_sukoon":
        # Target letters: q, t, b, j, d
        target_chars = {'q', 't', 'b', 'j', 'd'}
        relevant = [s for s in segments if s["char"] in target_chars]
        
        # Default to final segment if no specific letter matches
        seg = relevant[-1] if relevant else segments[-1]
        
        # Extract audio slice plus a 100ms padding to capture post-consonant bounce
        start_idx = int(seg["start"] * sr)
        end_idx = min(len(audio), int((seg["end"] + 0.1) * sr))
        slice_audio = audio[start_idx:end_idx]
        
        passed, stats = check_qalqalah_bounce(slice_audio, sr)
        report["pass"] = passed
        report["metrics"] = stats
        report["details"] = {
            "status": "compliant" if passed else "insufficient_secondary_bounce_or_no_occlusion",
            "segment_start": seg["start"],
            "segment_end": seg["end"]
        }
        
    elif rule_mask == "ghunnah":
        # Target letters: n, m
        target_chars = {'n', 'm'}
        relevant = [s for s in segments if s["char"] in target_chars]
        seg = relevant[-1] if relevant else segments[-1]
        
        start_idx = int(seg["start"] * sr)
        end_idx = int(seg["end"] * sr)
        slice_audio = audio[start_idx:end_idx]
        
        passed, sustained_dur, avg_ratio = check_ghunnah(slice_audio, sr)
        report["pass"] = passed
        report["metrics"] = {
            "sustained_duration_seconds": round(sustained_dur, 3),
            "average_nasal_ratio": round(avg_ratio, 4)
        }
        report["details"] = {
            "status": "compliant" if passed else "nasal_resonance_not_sustained_800ms",
            "segment_start": seg["start"],
            "segment_end": seg["end"]
        }
        
    elif rule_mask == "madd" or rule_mask == "shaddah_with_madd" or rule_mask == "muqattaat":
        # Target: vowel elongation segment
        vowels = {'a', 'i', 'u', 'e', 'o', 'y', '\''}
        relevant = [s for s in segments if s["char"] in vowels]
        
        # If no vowels, use the longest segment
        if relevant:
            t_start = min(s["start"] for s in relevant)
            t_end = max(s["end"] for s in relevant)
        else:
            t_start, t_end = segments[0]["start"], segments[-1]["end"]
            
        dur = t_end - t_start
        start_idx = int(t_start * sr)
        end_idx = int(t_end * sr)
        slice_audio = audio[start_idx:end_idx]
        
        # Check expected counts
        expected_dur = 1.6 if rule_mask == "madd" else 2.4
        passed = dur >= expected_dur
        
        pitch_diff = check_pitch_stability(slice_audio, sr)
        
        report["pass"] = passed
        report["metrics"] = {
            "measured_duration_seconds": round(dur, 3),
            "pitch_stability_index": round(pitch_diff, 4)
        }
        report["details"] = {
            "status": "compliant" if passed else "vowel_elongation_too_short",
            "expected_duration_seconds": expected_dur,
            "pitch_contour": "stable" if pitch_diff <= 0.15 else "unstable"
        }
        
    elif rule_mask in ["heavy_letter", "heavy_light_alif", "heavy_light_laam", "heavy_light_raa"]:
        t_start = segments[0]["start"]
        t_end = segments[-1]["end"]
        dur = t_end - t_start
        
        try:
            centroids = librosa.feature.spectral_centroid(y=audio, sr=sr)
            avg_centroid = float(np.mean(centroids))
        except Exception as e:
            logger.error(f"Error computing spectral centroid in rule {rule_mask}: {e}")
            avg_centroid = 0.0
            
        centroid_ceiling = 2500.0
        passed = avg_centroid <= centroid_ceiling
        
        report["pass"] = passed
        report["metrics"] = {
            "measured_duration_seconds": round(dur, 3),
            "spectral_centroid_hz": round(avg_centroid, 2)
        }
        report["details"] = {
            "status": "compliant" if passed else "insufficient_velarization_high_centroid",
            "centroid_ceiling_hz": centroid_ceiling
        }
        
    elif rule_mask in ["fatha", "kasra", "damma"]:
        t_start, t_end = segments[0]["start"], segments[-1]["end"]
        dur = t_end - t_start
        passed = 0.4 <= dur <= 1.2
        
        report["pass"] = passed
        report["metrics"] = {
            "measured_duration_seconds": round(dur, 3)
        }
        report["details"] = {
            "status": "compliant" if passed else "short_vowel_out_of_bounds",
            "expected_range": [0.4, 1.2]
        }
        
    else:
        # Default fallback rules (e.g. single_letter, compound_letter)
        t_start = segments[0]["start"]
        t_end = segments[-1]["end"]
        dur = t_end - t_start
        
        # Check waqf (proper stop) decay profile at the end of the word
        stop_passed, stop_rms = check_proper_stop(audio, sr, t_end)
        
        report["pass"] = stop_passed
        report["metrics"] = {
            "measured_duration_seconds": round(dur, 3),
            "trailing_rms_db": round(stop_rms, 2)
        }
        report["details"] = {
            "status": "compliant" if stop_passed else "improper_waqf_breath_leak",
            "waqf_evaluation": "passed" if stop_passed else "failed"
        }
        
    return cast_to_python(report)

