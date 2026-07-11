import io
import os
import sys
import logging
import numpy as np
import torch
import librosa

logger = logging.getLogger(__name__)

# Configure stdout/stderr encoding for UTF-8 on Windows
for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        try:
            stream.reconfigure(encoding="utf-8")
        except Exception:
            pass

def get_compute_device() -> torch.device:
    """
    Compute Device Auto-Selection logic:
    Device = "cuda" if torch.cuda.is_available() else "cpu"
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Target execution layer selected: {device}")
    return device

def standardize_audio(audio_bytes: bytes) -> np.ndarray:
    """
    Audio Standardization Engine:
    - Target sampling rate: 16000Hz (Mono)
    - Bit depth: 32-bit float
    - Mathematical resampling: Kaiser Window high-fidelity interpolation ('kaiser_best')
    """
    try:
        audio_file = io.BytesIO(audio_bytes)
        # librosa.load will decode, convert to mono, and resample with kaiser_best
        audio, sr = librosa.load(audio_file, sr=16000, mono=True, res_type='kaiser_best')
        return audio
    except Exception as e:
        logger.error(f"Error during audio standardization: {e}")
        raise ValueError(f"Failed to standardize audio stream: {e}")

def calculate_rms(y: np.ndarray) -> float:
    """
    Calculate the root-mean-square (RMS) energy of a 1D signal.
    """
    if len(y) == 0:
        return 0.0
    return float(np.sqrt(np.mean(y ** 2)))

def fallback_energy_check(chunk: np.ndarray, window_ms=25, sr=16000, threshold_db=-45) -> bool:
    """
    Fallback Gating check:
    Computes absolute amplitude envelopes over a rolling window (25 ms) and check if RMS energy <= -45 dB.
    Returns True if the chunk contains frames exceeding the threshold (i.e. keep the chunk).
    """
    window_samples = int(sr * (window_ms / 1000.0))  # 16000 * 0.025 = 400 samples
    threshold_rms = 10 ** (threshold_db / 20.0)      # -45 dB -> ~0.00562
    
    if len(chunk) < window_samples:
        return calculate_rms(chunk) > threshold_rms
        
    # Check rolling windows with an overlap step of 50 samples for efficiency
    step = 50
    for i in range(0, len(chunk) - window_samples + 1, step):
        window = chunk[i:i+window_samples]
        if calculate_rms(window) > threshold_rms:
            return True
    return False

def process_audio_vad(audio: np.ndarray, model, device) -> np.ndarray:
    """
    Silence & Padding Management Pipeline:
    1. Splits audio into 32ms chunks (512 samples at 16kHz).
    2. Runs Silero VAD state machine at probability threshold P_speech >= 0.5.
    3. If VAD drops the frame, checks fallback RMS energy threshold (E_rms > -45 dB).
    4. Truncates dropped frames and merges kept ones into a clean Array Truncation Buffer.
    """
    sr = 16000
    chunk_size = 512  # 32ms chunks
    
    kept_chunks = []
    
    # Process audio chunk-by-chunk
    for i in range(0, len(audio), chunk_size):
        chunk = audio[i:i+chunk_size]
        
        # Zero-pad the last chunk if it's smaller than 512
        if len(chunk) < chunk_size:
            chunk_padded = np.pad(chunk, (0, chunk_size - len(chunk)), mode='constant')
        else:
            chunk_padded = chunk
            
        # Convert chunk to PyTorch tensor
        chunk_tensor = torch.from_numpy(chunk_padded).float().to(device)
        
        # Run Silero VAD model to get speech probability
        with torch.no_grad():
            try:
                # Silero VAD model signature expects 1D or 2D tensor and sampling rate
                # e.g., model(x, sr)
                speech_prob = model(chunk_tensor.unsqueeze(0) if chunk_tensor.ndim == 1 else chunk_tensor, sr).item()
            except Exception as e:
                logger.error(f"Silero VAD inference exception on frame pointer {i}: {e}")
                speech_prob = 0.0
                
        # Primary check: Silero VAD threshold
        if speech_prob >= 0.5:
            kept_chunks.append(chunk)
        else:
            # Secondary check: Fallback mathematical trim via absolute amplitude envelope
            if fallback_energy_check(chunk, window_ms=25, sr=sr, threshold_db=-45):
                kept_chunks.append(chunk)
                
    if not kept_chunks:
        # If everything was stripped, return a small array of silence to avoid downstream errors
        return np.zeros(0, dtype=np.float32)
        
    return np.concatenate(kept_chunks)
