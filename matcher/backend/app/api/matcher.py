import io
import logging
import numpy as np
import torch
import librosa
from fastapi import APIRouter, File, UploadFile, Request, HTTPException
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Matcher"])

def load_audio_in_memory(audio_bytes: bytes) -> np.ndarray:
    """
    Loads audio bytes in-memory and standardizes to 16kHz mono.
    Uses librosa.load with a BytesIO file-like object to transcode and resample.
    If the audio is already 16kHz mono, it loads directly without resampling overhead.
    """
    audio_file = io.BytesIO(audio_bytes)
    # librosa.load will handle standard formats like WAV, MP3, FLAC, etc.
    # It converts multi-channel to mono and resamples to 16000Hz.
    audio, sr = librosa.load(audio_file, sr=16000, mono=True)
    return audio

@router.post("/matcher/recommend")
async def recommend(request: Request, file: UploadFile = File(...)):
    # 1. Read bytes
    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file.")
        
    # 2. Transcode in memory to 16kHz mono
    try:
        audio = load_audio_in_memory(audio_bytes)
    except Exception as e:
        logger.error(f"Failed to transcode audio in memory: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Could not transcode audio. Make sure the file format is supported. Error: {str(e)}"
        )
        
    # Check if database matrix is loaded
    if not hasattr(request.app.state, "qari_matrix") or request.app.state.qari_matrix is None:
        raise HTTPException(status_code=500, detail="Qari vector database is not loaded on the server.")
        
    # 3. Model Inference to extract 768-dimensional user voice print
    device = request.app.state.device
    feature_extractor = request.app.state.feature_extractor
    model = request.app.state.model
    
    try:
        # Extract features and perform forward pass
        inputs = feature_extractor(audio, sampling_rate=16000, return_tensors="pt")
        input_values = inputs.input_values.to(device)
        
        with torch.no_grad():
            outputs = model(input_values)
            
        last_hidden_state = outputs.last_hidden_state
        mean_pooled = torch.mean(last_hidden_state, dim=1).squeeze(0)
        user_vector = mean_pooled.cpu().numpy()  # shape (768,)
    except Exception as e:
        logger.error(f"Error during feature extraction model inference: {e}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")
        
    # 4. Compute cosine similarity against database of 202 pre-compiled Qari vectors
    try:
        user_vector_2d = user_vector.reshape(1, -1)
        similarities = cosine_similarity(user_vector_2d, request.app.state.qari_matrix)[0]
        
        # Find highest match
        best_idx = np.argmax(similarities)
        best_qari = request.app.state.qari_names[best_idx]
        best_similarity = float(similarities[best_idx])
        
        # Compute confidence percentage (clamped between 0.0 and 100.0)
        confidence_pct = max(0.0, min(100.0, best_similarity * 100.0))
        
        return {
            "match": best_qari,
            "score": best_similarity,
            "confidence_percentage": confidence_pct
        }
    except Exception as e:
        logger.error(f"Error during matching computation: {e}")
        raise HTTPException(status_code=500, detail=f"Matching calculation failed: {str(e)}")
