# Itqān (إتقان) — AI Quranic Voice Engine & Tajweed Assessment

**Itqān** is an advanced AI system for Quranic voice recognition and Tajweed rule evaluation. It features a speaker-verification model to match reciters with top Qari voices and a Wav2Vec2 CTC forced-alignment DSP pipeline for assessing Quranic pronunciation and Tajweed rules (such as *Madd* stretch duration and *Ghunnah* nasalization).

---

## 🌟 Key Features

1. **Voice Qari Matcher**:
   - Uses Microsoft's `wavlm-base-plus-sv` audio x-vector embeddings.
   - Cosine similarity matching against **242 Qari vector profiles** stored in memory.
   - Recommends the top matching Qaris for any user recitation snippet.

2. **Tajweed Forced Alignment & DSP Engine**:
   - Uses `jonatasgrosman/wav2vec2-large-xlsr-53-arabic` for frame-by-frame character/phoneme forced alignment.
   - Signal processing algorithms evaluate specific Tajweed rules:
     - **Madd (مد)**: Analyzes audio segment duration against minimum timing thresholds.
     - **Ghunnah (غنة)**: Evaluates nasalization energy ratio within targeted spectral bands.

3. **Modern Interactive Web Frontend**:
   - Glassmorphic, dark-mode web user interface built with HTML5, CSS3, and JavaScript.
   - Interactive audio recording, file upload, and real-time visualization of alignment timings and scores.

---

## 📁 Project Structure

```
Itqān/
├── README.md                           # Project documentation & instructions
├── test_tajweed_api.py                 # API test script
├── itqan-phase1/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py                 # FastAPI application & REST endpoints
│   │   │   ├── matcher.py              # VoiceMatcher (WavLM SV & Cosine Sim)
│   │   │   └── tajweed.py              # TajweedEvaluator (Wav2Vec2 CTC & DSP)
│   │   ├── data/
│   │   │   └── vector_db.json          # Precomputed Qari voice embeddings
│   │   └── requirements.txt            # Python dependencies
│   └── frontend_basic/
│       ├── index.html                  # Voice Qari Matcher UI
│       └── tajweed.html                # Tajweed Evaluator UI
```

---

## 🚀 Quick Start & Running Instructions

### 1. Prerequisites
Ensure you have **Python 3.10+** installed on your system.

### 2. Install Backend Dependencies
Open a terminal and navigate to the backend directory:

```bash
cd itqan-phase1/backend
pip install -r requirements.txt
```

*Required packages include: `fastapi`, `uvicorn`, `python-multipart`, `transformers`, `torch`, `torchaudio`, `librosa`, `scikit-learn`, `numpy`.*

---

### 3. Start the Backend API Server

Navigate to the `itqan-phase1/backend` directory and start Uvicorn:

```bash
cd itqan-phase1/backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

*Note: On initial launch, the server will download/load the AI models into memory (`WavLM` and `Wav2Vec2 Arabic`). This initialization takes ~15–30 seconds.*

#### Check Server Health
Verify that the backend is up and models are loaded:
```bash
curl http://127.0.0.1:8000/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "matcher_loaded": true,
  "tajweed_loaded": true,
  "qari_count": 242
}
```

---

### 4. Start the Frontend Web Application

Open a second terminal window, navigate to the `frontend_basic` directory, and launch a lightweight web server:

```bash
cd itqan-phase1/frontend_basic
python -m http.server 3000
```

Open your web browser and access the application interfaces:
- **Voice Qari Matcher**: [http://127.0.0.1:3000/index.html](http://127.0.0.1:3000/index.html)
- **Tajweed Evaluator**: [http://127.0.0.1:3000/tajweed.html](http://127.0.0.1:3000/tajweed.html)

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `GET` | `/health` | Server & model status | None |
| `POST` | `/api/v1/matcher/recommend` | Find matching Qaris for audio | `file`: Audio file (WAV/MP3/M4A) |
| `POST` | `/api/v1/tajweed/analyze` | Forced alignment & rule check | `file`: Audio file, `text`: Target Arabic string |

---

## 🧪 Testing the API

To verify the endpoints via command line, run the provided test script from the project root:

```bash
python test_tajweed_api.py
```
