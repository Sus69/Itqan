import os
import json
import logging
from contextlib import asynccontextmanager
import numpy as np
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from app.api.tajweed import router as tajweed_router

# Configure stdout/stderr encoding for UTF-8 on Windows
import sys
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

# Global Workspace Base Directory (recomputes to tajweed/ subproject root)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== Starting Itqan FastAPI Tajweed Teacher Server ===")
    
    # 1. Device selection
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    app.state.device = device
    logger.info(f"Using device for inference: {device}")
    
    # 2. Load Tajweed Reference Database JSON
    tajweed_db_path = os.path.join(BASE_DIR, "data", "tajweed_reference_db.json")
    if os.path.exists(tajweed_db_path):
        logger.info(f"Loading Tajweed reference database from {tajweed_db_path}...")
        try:
            with open(tajweed_db_path, "r", encoding="utf-8") as f:
                app.state.tajweed_db = json.load(f)
            logger.info("Tajweed reference database loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Tajweed database: {e}")
            app.state.tajweed_db = {}
    else:
        logger.warning(f"Tajweed database file not found at {tajweed_db_path}!")
        app.state.tajweed_db = {}

    # Load Qaida Master Matrix JSON
    qaida_matrix_path = os.path.join(BASE_DIR, "data", "itqan_qaida_master_matrix.json")
    if os.path.exists(qaida_matrix_path):
        logger.info(f"Loading Qaida master matrix from {qaida_matrix_path}...")
        try:
            with open(qaida_matrix_path, "r", encoding="utf-8") as f:
                app.state.qaida_matrix = json.load(f)
            logger.info("Qaida master matrix loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Qaida master matrix: {e}")
            app.state.qaida_matrix = {}
    else:
        logger.warning(f"Qaida master matrix file not found at {qaida_matrix_path}!")
        app.state.qaida_matrix = {}

    # 3. Load Silero VAD model locally
    logger.info("Loading Silero VAD model locally...")
    try:
        from silero_vad import load_silero_vad
        app.state.silero_model = load_silero_vad()
        app.state.silero_model.eval()
        logger.info("Silero VAD model loaded successfully.")
    except Exception as e:
        logger.critical(f"Failed to load Silero VAD model: {e}")
        app.state.silero_model = None

    # 4. Load MMS_FA Aligner model locally
    logger.info("Loading MMS_FA forced-alignment model...")
    try:
        import torchaudio
        bundle = torchaudio.pipelines.MMS_FA
        app.state.aligner_model = bundle.get_model().to(device)
        app.state.aligner_tokenizer = bundle.get_tokenizer()
        app.state.aligner_labels = bundle.get_labels()
        logger.info("MMS_FA forced-alignment model loaded successfully.")
    except Exception as e:
        logger.critical(f"Failed to load MMS_FA model: {e}")
        app.state.aligner_model = None
        app.state.aligner_tokenizer = None
        app.state.aligner_labels = None
        
    yield
    
    logger.info("=== Shutting down Itqan FastAPI Tajweed Teacher Server ===")

app = FastAPI(
    title="Itqān Tajweed Teacher Server",
    description="FastAPI server for real-time Tajweed recitation analysis and evaluation",
    version="1.0.0",
    lifespan=lifespan
)

# Loose CORS rules to support React frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include recommend API router
app.include_router(tajweed_router, prefix="/api/v1")

# Mount data folder to serve reference audio files
app.mount("/data", StaticFiles(directory=os.path.join(BASE_DIR, "data")), name="data")

@app.get("/health")
def health_check():
    db_loaded = hasattr(app.state, "tajweed_db") and app.state.tajweed_db is not None
    qaida_loaded = hasattr(app.state, "qaida_matrix") and app.state.qaida_matrix is not None
    model_loaded = hasattr(app.state, "silero_model") and app.state.silero_model is not None
    aligner_loaded = hasattr(app.state, "aligner_model") and app.state.aligner_model is not None
    
    is_healthy = db_loaded and qaida_loaded and model_loaded and aligner_loaded
    return {
        "status": "healthy" if is_healthy else "degraded",
        "database_loaded": db_loaded,
        "qaida_matrix_loaded": qaida_loaded,
        "model_loaded": model_loaded,
        "aligner_model_loaded": aligner_loaded,
        "device": str(getattr(app.state, "device", "unknown")),
        "classes_count": len(getattr(app.state, "tajweed_db", {})),
        "qaida_lessons_count": len(getattr(app.state, "qaida_matrix", {}))
    }

@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    static_html = os.path.join(os.path.dirname(__file__), "static", "index.html")
    if os.path.exists(static_html):
        with open(static_html, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read(), status_code=200)
    return HTMLResponse(content="<h1>Itqan Tajweed Teacher UI Template Not Found</h1>", status_code=404)
