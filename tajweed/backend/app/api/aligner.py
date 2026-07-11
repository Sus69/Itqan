import torch
import torchaudio
import uroman as ur
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Cache uroman instance
_uroman_instance = None

def get_uroman():
    global _uroman_instance
    if _uroman_instance is None:
        _uroman_instance = ur.Uroman()
    return _uroman_instance

def clean_arabic_text(text: str) -> str:
    """
    Strips symbols that are not letters or standard markers for better alignment.
    """
    # Strip common non-letter decorations
    decorations = ["۩", "۝", "۞", "﷽"]
    for dec in decorations:
        text = text.replace(dec, "")
    return text.strip()

def align_audio(waveform_np: np.ndarray, text_arabic: str, model=None, tokenizer=None, labels=None) -> list:
    """
    Aligns a resampled numpy audio array (16kHz mono) to the target Arabic text.
    Returns:
        list of dicts containing segment boundaries:
        [{'char': 'b', 'start': 0.12, 'end': 0.34}, ...]
    """
    # 1. Fallback to local loads if model components are not passed (useful for tests/isolated calls)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    if model is None or tokenizer is None or labels is None:
        logger.info("Aligner components not provided. Loading MMS_FA locally...")
        bundle = torchaudio.pipelines.MMS_FA
        model = bundle.get_model().to(device)
        tokenizer = bundle.get_tokenizer()
        labels = bundle.get_labels()
    
    # 2. Transliterate text to romanized form
    text_clean = clean_arabic_text(text_arabic)
    uroman = get_uroman()
    romanized = uroman.romanize_string(text_clean, lcode="ara").strip().lower()
    
    # Split text into list of words as required by torchaudio tokenizer
    words = romanized.split()
    if not words:
        logger.warning("Romanized text is empty!")
        return []
        
    try:
        # 3. Tokenize words
        tokens = tokenizer(words)
        flat_tokens = [t for w in tokens for t in w]
        
        if not flat_tokens:
            logger.warning(f"No tokens generated for words: {words}")
            return []
            
        # 4. Run model inference to get emissions
        waveform = torch.tensor(waveform_np, dtype=torch.float32).unsqueeze(0).to(device)
        
        with torch.inference_mode():
            # MMS_FA expects a 16kHz mono input
            emissions, _ = model(waveform)
            emissions = torch.log_softmax(emissions, dim=-1)
            
        # 5. Execute forced Viterbi alignment
        targets = torch.tensor([flat_tokens], dtype=torch.int32, device=device)
        path, scores = torchaudio.functional.forced_align(emissions, targets)
        path = path[0]
        scores = scores[0]
        
        # 6. Group path frames into time spans
        # MMS_FA has hop_length = 320 samples (20ms at 16kHz)
        frame_duration = 320 / 16000.0
        spans = torchaudio.functional.merge_tokens(path, scores)
        
        segments = []
        for span in spans:
            token_id = span.token
            char = labels[token_id] if token_id < len(labels) else f"<{token_id}>"
            segments.append({
                "char": char,
                "start": float(span.start * frame_duration),
                "end": float(span.end * frame_duration),
                "token_id": int(token_id)
            })
            
        logger.info(f"Successfully aligned text. Generated {len(segments)} character segments.")
        return segments
        
    except Exception as e:
        logger.error(f"Forced alignment error: {e}", exc_info=True)
        return []
