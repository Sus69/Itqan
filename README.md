# Itqān (إتقان) — AI Quranic Voice Engine & Tajweed Assessment

**Itqān** is a state-of-the-art AI-powered platform for Quranic voice recognition, Qari style matching, and real-time Tajweed rule evaluation. It combines deep learning acoustic models with digital signal processing (DSP) to analyze pronunciation accuracy, timing (*Madd*), nasalization (*Ghunnah*), bounce acoustics (*Qalqalah*), and heavy/light letter formants (*Tafkheem/Tarqeeq*).

---

## Key Features

1. **Voice Qari Matcher**:
   - Uses Microsoft's `wavlm-base-plus-sv` audio x-vector embeddings.
   - Cosine similarity matching against **242 precomputed Qari vector profiles**.
   - Recommends top matching Qaris and reciter styles for any user audio recording.

2. **5-Stage Tajweed Forced Alignment & DSP Engine**:
   - **Stage 1 (VAD & Signal Quality)**: Rejects silence, background noise, or clipped recordings using RMS and speech-frame density.
   - **Stage 2 (ASR & Text Verification)**: Levenshtein distance matching against the target Arabic verse using `jonatasgrosman/wav2vec2-large-xlsr-53-arabic`.
   - **Stage 3 (CTC Trellis Forced Alignment)**: Frame-by-frame character/phoneme acoustic boundary alignment.
   - **Stage 4 (Acoustic DSP Feature Extraction)**: Formants ($F_1, F_2, F_3$) for heavy/light letters, spectral nasal energy ratio for Ghunnah, and burst onset ratios for Qalqalah.
   - **Stage 5 (24-Level Rule Evaluation)**: Rule evaluation across all Tajweed categories (Madd, Ghunnah, Qalqalah, Ikhfa, Idgham, Izhar, Iqlab, etc.) with actionable corrections.

3. **Modern Web Application (`itqan-web`)**:
   - Built with **React 19**, **TypeScript**, **Vite**, and **TailwindCSS v4**.
   - **Tajweed Studio**: Live recording, waveform visualizer, 5-stage analysis, character alignment timeline, and rule diagnosis.
   - **Voice Matcher**: Recite and discover your closest Qari vocal match.
   - **Tajweed Course Hub**: Level-by-level curriculum covering Makharij, Sifaat, and Tajweed rules with interactive practice.
   - **Makhaarij Explorer**: Interactive anatomical articulation points guide.
   - **Noorani Qaida**: Step-by-step foundational lessons with audio examples.
   - **Practice Hub & Progress**: Daily targeted drills, accuracy streaks, and mastery tracking.

---

## Project Structure

```
Itqān/
├── README.md                           # Master project documentation
├── tajweed_syllabus.md                 # Tajweed curriculum & 24-level rule specifications
├── test_tajweed_api.py                 # Backend API automated test script
├── test_vad_silent.py                  # Silence & VAD rejection test script
├── master_vector_matrix.json           # Master dataset of Qari acoustic vectors
├── itqan-web/                          # Unified Itqān Web & AI Platform
│   ├── src/                            # Frontend React 19 + TypeScript Application
│   │   ├── pages/                      # Studio, VoiceMatch, Learn, Qaida, Makharij, Practice, etc.
│   │   ├── components/                 # UI components, AudioVisualizer, BackendStatus, etc.
│   │   ├── hooks/                      # Audio recording & backend integration hooks
│   │   └── lib/                        # API client, audio utilities, syllabus & Qaida data
│   ├── backend/                        # Python FastAPI AI Backend & DSP Pipeline
│   │   ├── app/
│   │   │   ├── main.py                 # FastAPI app, CORS, routes & lifespan warm-loader
│   │   │   ├── matcher.py              # VoiceMatcher (WavLM SV + Cosine Similarity)
│   │   │   └── tajweed.py              # TajweedEvaluator (5-Stage Alignment & DSP Engine)
│   │   ├── data/
│   │   │   └── vector_db.json          # Precomputed Qari voice embeddings (242 profiles)
│   │   ├── verify_dsp.py               # Standalone DSP & CTC Trellis unit test
│   │   └── requirements.txt            # Python dependencies
│   ├── package.json                    # Frontend dependencies & backend run scripts
│   └── vite.config.ts                  # Vite + TailwindCSS configuration
└── docs/                               # System architecture, API contracts & documentation
```

---

## Server Running Instructions

### 1. Prerequisites
- **Python 3.10+** (with `pip`)
- **Node.js 18+** & `npm`

---

### 2. Start the Backend API Server (FastAPI)

The backend server manages the AI models (WavLM, Wav2Vec2) and the 5-stage DSP evaluation pipeline.

#### Option A: Running from `itqan-web/backend` (Standard)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd itqan-web/backend
   ```

2. (Optional but recommended) Create and activate a Python virtual environment:
   - **Windows (PowerShell/CMD):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Launch the Uvicorn server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

#### Option B: Running from `itqan-web` (via npm scripts)

From the `itqan-web` directory, you can run the backend server shortcut:

```bash
cd itqan-web
npm run backend:dev
```

#### Option C: Running directly from the Repository Root

If you are at the project root directory (`Itqān/`), you can start the server using `--app-dir`:

```bash
python -m uvicorn app.main:app --app-dir itqan-web/backend --host 127.0.0.1 --port 8000 --reload
```

> **Note on Initial Startup**: During the first launch, the backend warm-loads `WavLM` and `Wav2Vec2 Arabic` models into memory. This takes ~15–30 seconds. Once loaded, inference is fast.

#### Verify Backend Server Health

- **Health Check Endpoint**:
  ```bash
  curl http://127.0.0.1:8000/health
  ```
  Expected Response:
  ```json
  {
    "status": "healthy",
    "matcher_loaded": true,
    "tajweed_loaded": true,
    "qari_count": 242
  }
  ```

- **Interactive API Documentation (Swagger UI)**:
  Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser.

---

### 3. Start the Web Application (`itqan-web`)

Open a **new terminal** window for the frontend client:

1. Navigate to the `itqan-web` directory:
   ```bash
   cd itqan-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure environment variables:
   Copy `.env.example` to `.env` if you need custom API URLs (defaults to `http://localhost:8000`):
   ```bash
   # .env
   VITE_API_BASE=http://localhost:8000
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   **[http://localhost:5173/](http://localhost:5173/)** (or the port indicated in your terminal).

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description | Payload / Parameters |
|---|---|---|---|
| `GET` | `/health` | Server & AI model initialization health check | None |
| `GET` | `/docs` | Interactive Swagger API documentation | None |
| `POST` | `/api/v1/matcher/recommend` | Find top matching Qari voices for reciter audio | `file`: Audio file (`.wav`, `.mp3`, `.m4a`, `.webm`) |
| `POST` | `/api/v1/tajweed/analyze` | 5-stage alignment & 24-level Tajweed rule analysis | `file`: Audio file, `text`: Target Arabic verse string |

---

## Testing & Verification Scripts

The repository includes automated verification scripts to test individual modules and end-to-end API communication:

1. **Standalone DSP & CTC Trellis Test** (runs locally without server):
   ```bash
   cd itqan-web/backend
   python verify_dsp.py
   ```
   *or from `itqan-web`:*
   ```bash
   npm run backend:test
   ```

2. **End-to-End Tajweed API Evaluation Test** (requires running backend):
   ```bash
   python test_tajweed_api.py
   ```

3. **VAD Silence & Audio Rejection Test** (requires running backend):
   ```bash
   python test_vad_silent.py
   ```

