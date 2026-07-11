import os
import json
import logging
from contextlib import asynccontextmanager
import numpy as np
import torch
from transformers import Wav2Vec2FeatureExtractor, HubertModel
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from app.api.matcher import router as matcher_router

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== Starting Itqan FastAPI Matching Server ===")
    
    # 1. Locate vector_db.json
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    vector_db_path = os.path.join(base_dir, "data", "vector_db.json")
    
    # Load vector_db matrix straight into RAM
    if os.path.exists(vector_db_path):
        logger.info(f"Loading vector database from {vector_db_path}...")
        try:
            with open(vector_db_path, "r", encoding="utf-8") as f:
                vector_db = json.load(f)
            
            app.state.vector_db = vector_db
            
            # Pre-compile Qari names and matrix for faster Cosine Similarity search
            qari_names = []
            qari_vectors = []
            for name, vec in vector_db.items():
                qari_names.append(name)
                qari_vectors.append(vec)
            
            app.state.qari_names = qari_names
            app.state.qari_matrix = np.array(qari_vectors, dtype=np.float32) if qari_vectors else None
            logger.info(f"Loaded and warmed {len(qari_names)} Qari vectors into memory matrix.")
        except Exception as e:
            logger.error(f"Failed to load or parse vector database: {e}")
            app.state.vector_db = {}
            app.state.qari_names = []
            app.state.qari_matrix = None
    else:
        logger.error(f"Vector database file not found at {vector_db_path}! Please run build_dataset.py first.")
        app.state.vector_db = {}
        app.state.qari_names = []
        app.state.qari_matrix = None
        
    # 2. Load the Hubert model and feature extractor locally
    logger.info("Loading Meta's facebook/hubert-base-ls960 model and feature extractor...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    app.state.device = device
    logger.info(f"Using device for inference: {device}")
    
    try:
        app.state.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained("facebook/hubert-base-ls960")
        app.state.model = HubertModel.from_pretrained("facebook/hubert-base-ls960")
        app.state.model.to(device)
        app.state.model.eval()
        logger.info("HuBERT model and feature extractor loaded successfully into memory.")
    except Exception as e:
        logger.critical(f"Failed to load HuBERT model: {e}")
        app.state.model = None
        app.state.feature_extractor = None
        
    yield
    
    logger.info("=== Shutting down Itqan FastAPI Matching Server ===")

app = FastAPI(
    title="Itqān Matching Server",
    description="FastAPI server for real-time Qari voice matching",
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
app.include_router(matcher_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    db_loaded = hasattr(app.state, "qari_matrix") and app.state.qari_matrix is not None
    model_loaded = hasattr(app.state, "model") and app.state.model is not None
    return {
        "status": "healthy" if db_loaded and model_loaded else "degraded",
        "database_loaded": db_loaded,
        "model_loaded": model_loaded,
        "device": str(getattr(app.state, "device", "unknown")),
        "qari_count": len(getattr(app.state, "qari_names", []))
    }

@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    static_html = os.path.join(os.path.dirname(__file__), "static", "index.html")
    if os.path.exists(static_html):
        with open(static_html, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read(), status_code=200)
    return HTMLResponse(content="<h1>Itqan Matching UI Template Not Found</h1>", status_code=404)
