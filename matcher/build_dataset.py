import os
import sys
import json
import glob
import logging
from pathlib import Path

# Configure stdout/stderr to use UTF-8 encoding on Windows to prevent UnicodeEncodeError
for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        try:
            stream.reconfigure(encoding="utf-8")
        except Exception:
            pass

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def setup_directories(raw_dir, processed_dir):
    """Ensure raw and processed directories exist."""
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(processed_dir, exist_ok=True)
    logger.info(f"Initialized directories:\n  Raw dump: {raw_dir}\n  Processed: {processed_dir}")

def process_audio_files(raw_dir, processed_dir):
    """
    Finds raw audio files, transcodes/resamples them to 16kHz mono .wav,
    and returns a list of tuples (qari_name, processed_path, audio_data).
    """
    try:
        import librosa
        import soundfile as sf
    except ImportError as e:
        logger.error(f"Required library missing: {e}. Please install the packages listed in requirements.txt.")
        return []

    # Common audio file extensions to search for
    extensions = ("*.mp3", "*.m4a", "*.wav", "*.flac", "*.ogg", "*.mp4", "*.aac")
    raw_files = []
    for ext in extensions:
        # Search recursively
        raw_files.extend(glob.glob(os.path.join(raw_dir, "**", ext), recursive=True))
    
    # Remove duplicates and sort
    raw_files = sorted(list(set(raw_files)))
    
    if not raw_files:
        logger.warning(f"No audio files found in '{raw_dir}'. Please place your raw audio files there and run the script again.")
        return []
    
    logger.info(f"Found {len(raw_files)} audio file(s) in raw dump. Starting standardization...")
    
    processed_items = []
    
    for filepath in raw_files:
        path_obj = Path(filepath)
        qari_name = path_obj.stem
        
        # Calculate target path to preserve subdirectory structure under processed/
        rel_path = os.path.relpath(filepath, raw_dir)
        rel_path_no_ext = os.path.splitext(rel_path)[0]
        target_path = os.path.join(processed_dir, f"{rel_path_no_ext}.wav")
        
        logger.info(f"Processing: {rel_path} -> {os.path.relpath(target_path, os.path.dirname(processed_dir))}")
        
        try:
            # Task 1: Load and resample to 16kHz mono
            audio, sr = librosa.load(filepath, sr=16000, mono=True)
            
            # Ensure parent directories for target file exist
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            
            # Save standard WAV file
            sf.write(target_path, audio, samplerate=16000)
            
            processed_items.append((qari_name, target_path, audio))
            logger.info(f"  [SUCCESS] Standardized & saved to {target_path}")
            
        except Exception as e:
            logger.error(f"  [ERROR] Failed to process {filepath}: {e}")
            continue
            
    return processed_items

def extract_embeddings(processed_items, vector_db_path):
    """
    Loads Meta's HuBERT model locally, processes standardized audio inputs,
    extracts time-pooled embeddings, and dumps them to a JSON vector DB.
    """
    try:
        import torch
        from transformers import Wav2Vec2FeatureExtractor, HubertModel
    except ImportError as e:
        logger.critical(f"Required library missing for embedding extraction: {e}. Please install the packages listed in requirements.txt.")
        sys.exit(1)
        
    if not processed_items:
        logger.info("No standardized items available for feature extraction.")
        return
        
    logger.info("Initializing Meta's facebook/hubert-base-ls960 model and feature extractor...")
    
    # Device configuration
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device for embedding extraction: {device}")
    
    try:
        # Load local or cache model/extractor
        feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained("facebook/hubert-base-ls960")
        model = HubertModel.from_pretrained("facebook/hubert-base-ls960")
        model.to(device)
        model.eval()
        logger.info("HuBERT model and feature extractor loaded successfully.")
    except Exception as e:
        logger.critical(f"Failed to load HuBERT model: {e}")
        sys.exit(1)
        
    embeddings_db = {}
    
    logger.info(f"Extracting embeddings for {len(processed_items)} files...")
    
    for qari_name, filepath, audio in processed_items:
        logger.info(f"Extracting embedding for Qari: {qari_name}")
        try:
            # Prepare audio input tensor
            inputs = feature_extractor(audio, sampling_rate=16000, return_tensors="pt")
            input_values = inputs.input_values.to(device)
            
            # Task 2: Offline model inference
            with torch.no_grad():
                outputs = model(input_values)
                
            # Get last hidden state tensor: shape [1, sequence_length, 768]
            last_hidden_state = outputs.last_hidden_state
            
            # Mean pool across time sequence axis (axis=1) -> shape [768]
            mean_pooled = torch.mean(last_hidden_state, dim=1).squeeze(0)
            
            # Convert embedding to standard Python float list
            embedding_list = mean_pooled.cpu().tolist()
            
            # Store in key-value dictionary (Key = Qari Name string, Value = 768 float list)
            embeddings_db[qari_name] = embedding_list
            logger.info(f"  [SUCCESS] Generated 768-dim embedding for {qari_name}")
            
        except Exception as e:
            logger.error(f"  [ERROR] Failed to extract embedding for {qari_name} ({filepath}): {e}")
            continue
            
    # Save the vector database to JSON
    try:
        # Create parent directories for vector DB if needed
        os.makedirs(os.path.dirname(vector_db_path), exist_ok=True)
        with open(vector_db_path, "w", encoding="utf-8") as f:
            json.dump(embeddings_db, f, indent=4)
        logger.info(f"Saved {len(embeddings_db)} embeddings to vector database: {vector_db_path}")
    except Exception as e:
        logger.critical(f"Failed to write vector database to {vector_db_path}: {e}")
        sys.exit(1)

def main():
    # Define local project paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    raw_dir = os.path.join(base_dir, "data", "raw_dump")
    processed_dir = os.path.join(base_dir, "data", "processed")
    vector_db_path = os.path.join(base_dir, "data", "vector_db.json")
    
    logger.info("=== Starting Itqan Audio Dataset Pipeline ===")
    
    # Create folder structure if missing
    setup_directories(raw_dir, processed_dir)
    
    # Task 1: Transcoding & Audio Normalization
    processed_items = process_audio_files(raw_dir, processed_dir)
    
    # Task 2: Local Feature Extraction & Vector Database Dump
    if processed_items:
        extract_embeddings(processed_items, vector_db_path)
    else:
        logger.info("Pipeline finished. Put audio files in 'data/raw_dump/' and re-run this script to build the vector DB.")
        
    logger.info("=== Pipeline Completed ===")

if __name__ == "__main__":
    main()
