import logging
from fastapi import APIRouter, File, UploadFile, Form, Request, HTTPException
from app.api.audio_processor import standardize_audio, process_audio_vad
from app.api.tajweed_evaluator import evaluate_recitation, evaluate_rule_dsp
from app.api.aligner import align_audio

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Tajweed Teacher"])

@router.get("/tajweed/classes")
async def get_tajweed_classes(request: Request):
    """
    Returns the loaded 21-class Tajweed reference database dictionary.
    """
    if not hasattr(request.app.state, "tajweed_db") or not request.app.state.tajweed_db:
        raise HTTPException(status_code=500, detail="Tajweed reference database is not loaded on the server.")
    return request.app.state.tajweed_db

@router.get("/qaida/matrix")
async def get_qaida_matrix(request: Request):
    """
    Returns the loaded 12-level Qaida master matrix database dictionary.
    """
    if not hasattr(request.app.state, "qaida_matrix") or not request.app.state.qaida_matrix:
        raise HTTPException(status_code=500, detail="Qaida master matrix database is not loaded on the server.")
    return request.app.state.qaida_matrix

@router.post("/tajweed/evaluate")
async def evaluate_recitation_endpoint(
    request: Request,
    class_id: int = Form(...),
    phrase_index: int = Form(...), # 0, 1, or 2 representing the Ayah example
    file: UploadFile = File(...)
):
    """
    Asynchronously accepts user recording files, standardizes audio,
    applies Silero VAD state machine and fallback gating, and performs
    rule-based DSP compliance evaluation.
    """
    # 1. Database validation
    if not hasattr(request.app.state, "tajweed_db") or not request.app.state.tajweed_db:
        raise HTTPException(status_code=500, detail="Tajweed reference database is not loaded.")
        
    class_key = str(class_id)
    if class_key not in request.app.state.tajweed_db:
        raise HTTPException(status_code=400, detail=f"Invalid Tajweed class ID: {class_id}")
        
    class_info = request.app.state.tajweed_db[class_key]
    phrases = class_info.get("phrases", [])
    if phrase_index < 0 or phrase_index >= len(phrases):
        raise HTTPException(status_code=400, detail=f"Invalid phrase index: {phrase_index}. Must be 0, 1, or 2.")
        
    phrase_metadata = phrases[phrase_index]
    expected_bounds = phrase_metadata.get("acoustic_expected_bounds", {})
    pedagogical = phrase_metadata.get("pedagogical_metadata", {})
    
    # 2. Read bytes
    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    except Exception as e:
        logger.error(f"Failed to read upload: {e}")
        raise HTTPException(status_code=400, detail="Failed to read uploaded audio file.")
        
    # 3. Resample and standardize
    try:
        raw_audio = standardize_audio(audio_bytes)
    except Exception as e:
        logger.error(f"Failed to standardise audio: {e}")
        raise HTTPException(status_code=400, detail=f"Audio standardisation failed: {str(e)}")
        
    # 4. Gating (Silero VAD + Fallback Energy Gating)
    try:
        if not hasattr(request.app.state, "silero_model") or request.app.state.silero_model is None:
            raise HTTPException(status_code=500, detail="Silero VAD model is not loaded on the server.")
            
        silero_model = request.app.state.silero_model
        device = request.app.state.device
        
        cleaned_audio = process_audio_vad(raw_audio, silero_model, device)
    except Exception as e:
        logger.error(f"Failed VAD gating: {e}")
        raise HTTPException(status_code=500, detail=f"Voice activity detection error: {str(e)}")
        
    # 5. DSP Evaluation
    try:
        evaluation_report = evaluate_recitation(cleaned_audio, expected_bounds)
        
        # Merge pedagogical metadata into the report
        evaluation_report["rule_name"] = phrase_metadata.get("rule_name")
        evaluation_report["text_anchor"] = phrase_metadata.get("text_anchor")
        evaluation_report["is_reference_correct_example"] = phrase_metadata.get("is_correct", True)
        evaluation_report["pedagogical"] = pedagogical
        
        return evaluation_report
    except Exception as e:
        logger.error(f"Failed evaluation: {e}")
        raise HTTPException(status_code=500, detail=f"DSP evaluation engine failed: {str(e)}")


LEVEL_RULES = {
    1: {"single_letter"},
    2: {"compound_letter"},
    3: {"fatha", "kasra", "damma"},
    4: {"madd"},
    5: {"tanween_fath", "tanween_kasr", "tanween_damm"},
    6: {"sukoon"},
    7: {"shaddah"},
    8: {"qalqalah_with_sukoon"},
    9: {"madd"},
    10: {"leen"},
    11: {"heavy_letter"},
    12: {"heavy_light_alif"},
    13: {"heavy_light_laam"},
    14: {"heavy_light_raa"},
    15: {"ghunnah"},
    16: {"muqattaat"}
}

@router.post("/tajweed/analyze")
async def analyze_recitation_endpoint(
    request: Request,
    word_id: str = Form(...),
    current_level: int = Form(...),
    audio_blob: UploadFile = File(...)
):
    """
    Unified assessment route that performs character forced-alignment and applies
    strict mathematical DSP rule evaluators based on set-intersection filters.
    """
    # 1. Lookup item in Qaida matrix database
    if not hasattr(request.app.state, "qaida_matrix") or not request.app.state.qaida_matrix:
        raise HTTPException(status_code=500, detail="Qaida master matrix database is not loaded on the server.")
        
    qaida_matrix = request.app.state.qaida_matrix
    matching_item = None
    
    for l_id, lesson in qaida_matrix.items():
        items = lesson.get("items", [])
        for item in items:
            if item.get("item_id") == word_id:
                matching_item = item
                break
        if matching_item:
            break
            
    if not matching_item:
        raise HTTPException(status_code=404, detail=f"Word ID '{word_id}' not found in the Qaida matrix database.")
        
    rule_mask = matching_item.get("rule_mask", "")
    word_arabic = matching_item.get("word_arabic", "")
    
    # 2. Compute Active Validation Targets via set-intersection
    rules_learned = set()
    for lvl in range(1, current_level + 1):
        if lvl in LEVEL_RULES:
            rules_learned.update(LEVEL_RULES[lvl])
            
    # Set intersection
    active_targets = rules_learned.intersection({rule_mask})
    
    if not active_targets:
        logger.info(f"Skipping evaluation: Rule '{rule_mask}' not applicable at level {current_level}.")
        return {
            "word_id": word_id,
            "word_arabic": word_arabic,
            "rule_mask": rule_mask,
            "status": "NOT_APPLICABLE",
            "message": f"Rule '{rule_mask}' is not applicable at Level {current_level} (unlocked at a higher level).",
            "evaluation": {
                "pass": True,
                "details": {
                    "status": "skipped_not_learned"
                }
            }
        }
        
    # 3. Standardize input audio blob
    try:
        audio_bytes = await audio_blob.read()
        waveform_np = standardize_audio(audio_bytes)
    except Exception as e:
        logger.error(f"Failed to decode and standardize audio: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted audio file: {e}")
        
    # 4. Perform Phonetic Forced-Alignment
    # Fetch cached MMS_FA model components from server state
    model = getattr(request.app.state, "aligner_model", None)
    tokenizer = getattr(request.app.state, "aligner_tokenizer", None)
    labels = getattr(request.app.state, "aligner_labels", None)
    
    segments = align_audio(waveform_np, word_arabic, model=model, tokenizer=tokenizer, labels=labels)
    
    # 5. Run Mathematical DSP Rule Evaluator
    try:
        eval_result = evaluate_rule_dsp(waveform_np, 16000, segments, rule_mask)
    except Exception as e:
        logger.error(f"DSP evaluation crashed: {e}", exc_info=True)
        eval_result = {
            "rule_mask": rule_mask,
            "pass": False,
            "metrics": {},
            "details": {
                "status": "error_during_dsp_evaluation",
                "error": str(e)
            }
        }
        
    return {
        "word_id": word_id,
        "word_arabic": word_arabic,
        "rule_mask": rule_mask,
        "status": "EVALUATED",
        "alignment_segments": segments,
        "evaluation": eval_result
    }

@router.post("/qaida/upload_reference")
async def upload_qaida_reference(
    request: Request,
    word_id: str = Form(...),
    current_level: int = Form(...),
    audio_file: UploadFile = File(...)
):
    """
    Accepts a teacher's recorded WAV reference file for a specific Qaida matrix word,
    saves/overwrites it on the server filesystem, and updates the JSON matrix.
    """
    import os
    import json
    import librosa
    import soundfile as sf

    # 1. Access matrix
    if not hasattr(request.app.state, "qaida_matrix") or not request.app.state.qaida_matrix:
        raise HTTPException(status_code=500, detail="Qaida master matrix database is not loaded.")
        
    matrix = request.app.state.qaida_matrix
    lvl_key = str(current_level)
    if lvl_key not in matrix:
        raise HTTPException(status_code=400, detail=f"Invalid level ID: {current_level}")
        
    lesson = matrix[lvl_key]
    items = lesson.get("items", [])
    
    target_item = None
    for item in items:
        if item.get("item_id") == word_id:
            target_item = item
            break
            
    if not target_item:
        raise HTTPException(status_code=404, detail=f"Word ID {word_id} not found in Level {current_level}.")
        
    ref_audio_path = target_item.get("reference_audio_path")
    if not ref_audio_path:
        lesson_subdir = f"lesson_{current_level:02d}"
        wav_filename = f"{word_id}_custom.wav"
        ref_audio_path = f"data/reference_audio/{lesson_subdir}/{wav_filename}"
        target_item["reference_audio_path"] = ref_audio_path
        
    # 2. Get absolute path in filesystem
    api_dir = os.path.dirname(os.path.abspath(__file__)) # tajweed/backend/app/api
    base_dir = os.path.abspath(os.path.join(api_dir, "..", "..", "..")) # tajweed
    full_target_path = os.path.join(base_dir, ref_audio_path.replace("/", os.sep))
    
    os.makedirs(os.path.dirname(full_target_path), exist_ok=True)
    
    # 3. Read uploaded bytes and transcode to 16kHz PCM WAV
    temp_path = full_target_path + ".temp"
    try:
        audio_bytes = await audio_file.read()
        
        # Save temp file
        with open(temp_path, "wb") as f:
            f.write(audio_bytes)
            
        # Transcode to 16kHz mono PCM 16-bit
        y, sr = librosa.load(temp_path, sr=16000, mono=True)
        sf.write(full_target_path, y, 16000, subtype='PCM_16')
        
        # Clean up temp
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        # Write matrix back to disk to persist custom path
        matrix_path = os.path.join(base_dir, "data", "itqan_qaida_master_matrix.json")
        try:
            with open(matrix_path, "w", encoding="utf-8") as f:
                json.dump(matrix, f, indent=2, ensure_ascii=False)
        except Exception as disk_err:
            logger.warning(f"Could not persist updated master matrix to disk: {disk_err}")
            
        logger.info(f"Successfully saved and transcoded reference audio for {word_id} to {full_target_path}")
        return {"status": "success", "reference_audio_path": ref_audio_path}
    except Exception as e:
        logger.error(f"Failed to transcode and save custom reference audio: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to save reference audio on server: {e}")
