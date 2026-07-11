# Project Context & Execution History

This file documents the steps, architecture, and modifications made during the development of the **Itqān** audio processing and embedding extraction project to maintain contextual continuity.

---

## 📅 Session Log: 2026-06-30

### 1. Goal & Requirements
- **Goal**: Build a self-contained data engineering script (`build_dataset.py`) to process an unregulated dump of Surah Al-Fatiha audio files, normalize them to a machine learning standard, and generate a local vector database.
- **Input**: Raw audio files (.mp3, .m4a, .wav) placed in `data/raw_dump/` with naming format: `{qari_name}.{ext}`.
- **Task 1 (Transcoding)**: Recursively locate audio files, resample them to 16kHz mono using `librosa`, and save as `.wav` under `data/processed/` preserving the subdirectory structure.
- **Task 2 (Embedding)**: Feed audio into Meta's local `facebook/hubert-base-ls960` model, mean-pool the `last_hidden_state` to generate a 768-dimensional vector, and dump a `{Qari_Name: Embedding}` mapping to `data/vector_db.json`.

---

### 2. Architecture & File Layout
The workspace structure was established as follows:
```
Itqān/
├── build_dataset.py          # Processing and offline embedding script
├── requirements.txt          # Python library dependencies
├── CHANGELOG.md              # Context preservation log (this file)
└── data/
    ├── raw_dump/             # Input directory for raw audio files
    ├── processed/            # Output directory for standardized 16kHz WAV files
    └── vector_db.json        # Local JSON database storing HuBERT embeddings
```

---

### 3. Implementation Details

#### **requirements.txt**
Defines offline-capable packages:
```text
librosa
soundfile
numpy
torch
transformers
```

#### **build_dataset.py**
Key engineering features implemented:
- **Recursive Audio Search**: Searches all subdirectory levels for common raw audio files (`.mp3`, `.m4a`, `.wav`, etc.).
- **UTF-8 Log Support on Windows**: Dynamically reconfigures `sys.stdout` and `sys.stderr` to prevent `UnicodeEncodeError` when processing paths that contain characters like `ā`.
- **Model Execution Device Selection**: Auto-detects and uses GPU (`cuda`) if available, falling back to CPU.
- **HuBERT Inference Pipeline**:
  - Automatically loads and caches model weights from Hugging Face hub on the first run.
  - Implements `torch.no_grad()` to save memory during inference.
  - Squeezes and mean-pools sequence tensors to compress the footprint to a single static 768-dimensional list.
- **Fault-Tolerant Loops**: Gracefully logs errors and proceeds to the next audio clip if a file is corrupt or unreadable.

---

## 📅 Session Log: 2026-06-30 (Step 2: FastAPI & API Architecture)

### 1. Goal & Requirements
- **Goal**: Create a high-performance, asynchronous Python server using **FastAPI** to match voice recordings against a database of 202 Qaris.
- **Endpoint**: `POST /api/v1/matcher/recommend` (multipart/form-data audio file).
- **Server Lifecycle**:
  - Load the pre-compiled `vector_db.json` matrix straight into RAM on server startup so it stays warm in memory.
  - Load Meta's `facebook/hubert-base-ls960` model and feature extractor into memory on startup.
- **In-Memory Transcoding**: Standardize incoming audio binary stream directly in memory using `librosa` to 16kHz mono (no temporary files saved to disk).
- **Matching Pipeline**: Compute `cosine_similarity` using `scikit-learn` against the pre-compiled Qari matrix, and return the highest match with its confidence percentage.

---

### 2. Architecture & File Layout
The directory layout was expanded to separate the backend web server from the dataset assets:
```text
Itqān/
├── backend/                           # New Server Directory
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # Server entrypoint and CORS initialization
│   │   └── api/
│   │       ├── __init__.py
│   │       └── matcher.py             # The /recommend API endpoint logic
│   └── requirements.txt               # Backend dependencies (uvicorn, fastapi, scikit-learn, etc.)
├── build_dataset.py                   # Step 1 dataset construction script
├── data/
│   ├── raw_dump/                      # Original audio files
│   ├── processed/                     # Transcoded WAV files
│   └── vector_db.json                 # Pre-compiled Qari vector database
└── CHANGELOG.md                       # Execution history log (this file)
```

---

### 3. Implementation Details

#### **backend/requirements.txt**
Includes uvicorn, fastapi, scikit-learn, python-multipart, torch, transformers, and librosa.

#### **backend/app/main.py**
- **Lifespan Manager**: Handles startup/shutdown lifecycle to warm load the 202 Qari vectors and HuBERT model weights in memory.
- **Pre-compiled Matrix**: Transforms the loaded python dict database into a static 2D float32 numpy matrix (`app.state.qari_matrix`) and a list of Qari names to minimize computation latency on incoming API queries.
- **CORS Configuration**: Standard loose rules to support client application communication.
- **Health Check Route**: Provides diagnostic information on model/database loading.

#### **backend/app/api/matcher.py**
- **In-Memory Loader**: Utilizes `io.BytesIO` and `librosa.load(..., sr=16000, mono=True)` to decode and resample standard audio file streams directly in memory.
- **Hubert Inference**: Generates the 768-dimensional user voice print on the target execution device (GPU/CPU).
- **Cosine Similarity**: Utilizes `scikit-learn`'s `cosine_similarity` to perform rapid vector comparison, returning the matched Qari, similarity score, and confidence percentage.

---

### 4. Next Steps & Usage
1. Run the FastAPI backend:
   ```bash
   cd backend
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. Hit the health check: `http://127.0.0.1:8000/health`
3. Hit the recommender: `POST http://127.0.0.1:8000/api/v1/matcher/recommend` (pass audio file as form-data parameter `file`).

---

### 5. Execution & Run History
- **2026-06-30 20:24**: Created `backend/requirements.txt`, package structure, `main.py`, and `api/matcher.py`.
- **2026-06-30 20:25**: Ran verification script `verify_server.py`.
  - **Status**: FastAPI server successfully initialized. The health check returned `healthy` and confirmed loading of all 202 Qari vectors and HuBERT model weights.
  - **Result**: Sent test WAV file to `/matcher/recommend`. The endpoint successfully transcoded the bytes in-memory, ran model inference, computed cosine similarity against database matrix, and returned correct matching results with 100% confidence for the matching Qari.

---

## 📅 Session Log: 2026-07-01

### 1. Goal & Requirements
- **Goal**: Implement the second half of the project: the **Tajweed Teacher** assessment engine skeleton.
- **Goal 2**: Restructure the workspace to keep the **Voice Qari Matcher** (Engine 1) and the **Tajweed Teacher** (Engine 2) completely isolated and independent in their own directories.

### 2. Restructured Architecture & Layout
The workspace layout was divided into two standalone directories:
```text
Itqān/
├── matcher/                         # Qari Voice Matcher Directory
│   ├── backend/                     # Voice Matcher server app & CORS
│   │   ├── app/
│   │   │   ├── api/matcher.py       # Qari voice print matching
│   │   │   └── static/index.html    # Matcher UI
│   ├── data/                        # 202 Qaris voice prints dataset
│   └── build_dataset.py             # Data processing and embedding script
│
└── tajweed/                         # Tajweed Teacher Directory
    ├── backend/                     # Tajweed assessment server app & static files
    │   ├── app/
    │   │   ├── api/
    │   │   │   ├── audio_processor.py # Resampling, stateful VAD, RMS fallback
    │   │   │   ├── tajweed_evaluator.py # DSP duration & centroid checks
    │   │   │   └── tajweed.py       # API endpoints (/classes, /evaluate)
    │   │   └── static/index.html    # Tajweed teacher UI dashboard
    │   └── requirements.txt         # Lightweight VAD + DSP dependencies
    └── data/
        ├── processed/               # Diagnostic WAV audio folder
        └── tajweed_reference_db.json # 21-class, 63-entry reference skeleton
```

### 3. Implementation Details

#### **Restructuring Operations**
- Safely created `matcher/` and `tajweed/` folder subtrees.
- Moved voice matcher scripts, databases, and servers to the `matcher/` subdirectory.
- Reverted the voice matcher code files in `matcher/backend` back to voice matcher only.
- Cleaned up redundant root workspace folders.

#### **Tajweed Teacher Skeleton**
- **JSON Reference DB**: Programmatically generated `tajweed_reference_db.json` skeleton containing metadata schemas for 21 classes (63 phrase items, correct and error profiles).
- **Audio Processing Pipeline**: Created `audio_processor.py` executing 16kHz Mono Kaiser resampling, Silero VAD stateful gating ($P_{\text{speech}} \ge 0.5$), and secondary rolling RMS window checks ($E_{\text{rms}} \ge -45\text{ dB}$).
- **Evaluation DSP Engine**: Created `tajweed_evaluator.py` validating active pronunciation durations and checking spectral centroid ceilings (retraction bounds) or nasal band ratio bounds.
- **FastAPI Backend Server**: Created `main.py` and `api/tajweed.py` routes, mounting `/data` static files for reference playback.
- **Dedicated Dashboard UI**: Created `static/index.html` offering a 21-class rule card list, recitation studio with calligraphy representations, reference players, mic recording wave visualizers, and visual DSP metrics progress track meters.

### 4. Run & Execution History
- **2026-07-01 22:07**: Launched Tajweed Teacher FastAPI backend:
  - **Port**: 8001 (CPU execution layer).
  - **Status**: Loaded VAD model and reference JSON database. Health check returns healthy state.
- **2026-07-01 22:38**: Launched Qari Voice Matcher FastAPI backend:
  - **Port**: 8000 (CPU execution layer).
  - **Status**: Loaded Hubert model and database matrix of 202 Qaris. Health check returns healthy state.
- 2026-07-01 22:43: Cleanly shut down both servers.

---

## 📅 Session Log: 2026-07-02 (Phase 2: Syllabus Mapping & Automation Extraction)

### 1. Goal & Requirements
- **Goal**: Implement the second phase of the project: **Syllabus Mapping & Automation Extraction** for the progressive Tajweed/Qaida curriculum.
- **Task 1 (Ingestion & Normalization)**: Parse localized lesson strings from target open-source Flutter repository and programmatically construct a 12-level progressive Qaida matrix.
- **Task 2 (Reference Audio Seeding)**: Query the Quran.com API to resolve word coordinates, crawl matching teacher-style Muallim `.opus` files from the Hugging Face `zaibihassan/Quranic-Word-By-Word-Audio-Data` dataset repository raw CDN, transcode to standard **16kHz mono WAV**, and seed them hierarchically on disk.
- **Task 3 (Server Integration)**: Load the generated `itqan_qaida_master_matrix.json` on FastAPI startup and expose a dedicated `/qaida/matrix` GET endpoint to serve the progressive curriculum.

---

### 2. Restructured Architecture & Layout
The project directory layout has been populated with the normalization script and seeded audio assets:
```text
Itqān/
├── tajweed/
│   ├── backend/
│   │   └── app/
│   │       ├── api/
│   │       │   └── tajweed.py       # Exposes GET /qaida/matrix
│   │       └── main.py              # Lifespan manager loads itqan_qaida_master_matrix.json
│   ├── data/
│   │   ├── reference_audio/         # numerical folders lesson_01/ to lesson_12/ containing seeded WAV files
│   │   ├── itqan_qaida_master_matrix.json # Generated Qaida curriculum database
│   │   └── tajweed_reference_db.json
│   └── normalize_syllabus.py        # Ingestion, crawling, and transcoding script
```

---

### 3. Implementation Details

#### **normalize_syllabus.py**
- **Dynamic Curriculum Expansion**: Programmatically expands core character assets into a rich 12-level progressive curriculum map.
- **Algorithmic Rule Mask Tagging**: Assigns programmatic tracking rules (e.g. `single_letter`, `fatha`, `tanween_fath`, `madd`, `leen`, `sukoon`, `qalqalah_with_sukoon` for letters in قطب جد, `ghunnah` for Noon/Meem with Tashdeed, and `shaddah`).
- **CDN Raw Audio Downloader**: Streams matching `.opus` audio files directly using URL endpoints to bypass massive dataset scanning and Hugging Face rate-limits.
- **Audio Transcoding**: Decodes `.opus` binaries in memory using `librosa` and resamples to **16kHz mono PCM 16-bit WAV** using `soundfile` to store standard reference clips.

#### **FastAPI Server Lifespan & API Update**
- **Lifecycle Integration**: Warm-loads `itqan_qaida_master_matrix.json` into FastAPI `app.state.qaida_matrix` on startup.
- **Syllabus Endpoint**: Implemented route `GET /api/v1/qaida/matrix` in `api/tajweed.py` to serve the Qaida curriculum.
- **Enhanced Health Check**: Extended `/health` check route to query and verify both Tajweed and Qaida databases are healthy and loaded.

---

### 4. Run & Execution History
- **2026-07-02 18:22**: Ran `normalize_syllabus.py` pipeline:
  - **Status**: Completed successfully. Seeded **63** audio clips into 12 numeric subdirectories and generated `itqan_qaida_master_matrix.json`.
- **2026-07-02 18:23**: Ran `verify_matrix_assets.py` validator script:
  - **Status**: 100% verifications passed. All audio files confirmed to be 16kHz mono WAV format.
- **2026-07-02 18:24**: Launched Tajweed Teacher FastAPI backend on port 8001:
  - **Status**: Loaded uvicorn server successfully.
  - **Result**: Querying `/health` returned healthy state (`qaida_matrix_loaded: true`, `qaida_lessons_count: 12`). Querying `/api/v1/qaida/matrix` successfully returned the 12-level progressive curriculum.
- **2026-07-02 18:24**: Cleanly shut down uvicorn server.

---

## 📅 Session Log: 2026-07-02 (Phase 3 & Phase 4 Completion)

### 1. Goal & Requirements
- **Goal**: Integrate sub-second character forced alignment (MMS-FA) and build the DSP mathematical evaluators for Madd, Ghunnah, Waqf Stops, and Qalqalah, connected with an interactive frontend Fix-It loop.

### 2. Architecture & File Layout Updates
- [index.html](file:///c:/Users/manaa/Documents/appagent/Itqān/tajweed/backend/app/static/index.html): HTML UI, styling, SVG diagram, and Javascript Fix-It loop.
- [aligner.py](file:///c:/Users/manaa/Documents/appagent/Itqān/tajweed/backend/app/api/aligner.py): MMS-FA Romanized text alignment pipeline.
- [tajweed_evaluator.py](file:///c:/Users/manaa/Documents/appagent/Itqān/tajweed/backend/app/api/tajweed_evaluator.py): Trailing stops, Ghunnah, Qalqalah envelope checks, and type-caster wrapper.
- [tajweed.py](file:///c:/Users/manaa/Documents/appagent/Itqān/tajweed/backend/app/api/tajweed.py): Endpoint intersection logic and file standardized audio ingestion.
- [main.py](file:///c:/Users/manaa/Documents/appagent/Itqān/tajweed/backend/app/main.py): Preloaded aligner components lifespans.

### 3. Implementation Details
- **MMS forced alignment integration**: Transliterates Arabic to Romanized characters using `uroman`, then executes PyTorch forced alignment to output segment bounds.
- **DSP Mathematical check modules**: Added trailing energy Waqf stops check, pitch variance stability indexes (YIN), STFT nasal ratios, and occlusion bounce ratio trackers.
- **Dynamic Masking filter**: Exposes `POST /api/v1/tajweed/analyze` to filter evaluation rule checking matching student level progress.
- **SVG Anatomical Highlights & Micro-Recording Loop**: Implemented interactive HTML card segment click actions mapping consonants/vowels to active vocal region layers (Halq, Lisan, Shafatayn, Khayshum, Jawf) and enabling targeted micro-punch-ins.

### 4. Verification History
- **2026-07-02 18:44**: Ran `verify_dsp_pipeline.py` pipeline validator check on port 8004:
  - **Status**: 100% tests passed.
  - **Result**: Successfully verified single letter stops check evaluation at Level 1, dynamic masking locked rules at Level 1 (`NOT_APPLICABLE`), and full multi-character forced alignment evaluation at Level 10 (`EVALUATED`).

---

## 📅 Session Log: 2026-07-03 (Offline Hardcoded Qaida Curriculum)

### 1. Goal & Requirements
- **Goal**: Transition from dynamic, API-driven curriculum extraction/crawling to a fully hardcoded, offline progressive Qaida curriculum.
- **Goal 2**: Eliminate external runtime dependencies and rate-limiting issues associated with third-party Quran APIs (Quran.com) and Hugging Face audio datasets by bundling pre-processed resources locally.

### 2. Architecture & File Layout Updates
- [itqan_qaida_master_matrix.json](file:///c:/Users/manaa/Documents/appagent/Itqān/tajweed/data/itqan_qaida_master_matrix.json): Houses the entire 12-level progressive curriculum matrix directly, including item IDs, Arabic characters, phonetic names, pronunciations, rule masks, and local file paths to the seeded reference audios.
- [normalize_syllabus.py](file:///c:/Users/manaa/Documents/appagent/Itqān/tajweed/normalize_syllabus.py): Removed/deprecated the dynamic API crawling, querying, and downloading script since the system relies completely on the pre-packaged static database asset.

### 3. Implementation Details
- **Hardcoded Curriculum Database**: Standardized a static mapping of all 12 progressive Qaida lessons, embedding expected DSP bounds (duration thresholds, spectral centroid ceilings, etc.) and pre-resolved coordinate keys directly within the offline matrix JSON.
- **Offline Audio Referencing**: Configured the backend server and static frontend UI to reference local reference WAV files (`data/reference_audio/lesson_xx/...wav`) directly on the filesystem instead of downloading them dynamically from the Hugging Face CDN.
- **FastAPI Endpoints Integrity**: The `/api/v1/qaida/matrix` endpoint now serves the finalized hardcoded curriculum dataset directly from the server's warmed RAM state without initiating any external network requests.

---

## 📅 Session Log: 2026-07-11 (Bulk Recitations Scraper & Audio Standardization)

### 1. Goal & Requirements
- **Goal**: Scraping and bulk downloading Surah Al-Mulk (Surah 67) and Surah Ash-Shams (Surah 91) recitations from mp3quran.net for all available sheikhs.
- **Audio Processing**: Trim downloaded files to exactly 1 minute, convert them to 16kHz mono `.wav` format, and replace the original `.mp3` source files.
- **Folder Partitioning**: Organise the processed files in `matcher/data/processed/` under three distinct subfolders:
  - `baseline`: un-named sheikh/surah recitations (originally directly under `processed/`).
  - `deep`: Surah Al-Mulk recitations (`*_Al_Mulk.wav`).
  - `high`: Surah Ash-Shams recitations (`*_Ash_Shams.wav`).

---

### 2. Architecture & File Layout Updates
We introduced automation scripts in the workspace root and created the following partitioned folders:
```
Itqān/
├── download_recitations.py       # Scraper/downloader tool using mp3quran.net HTML cards
└── matcher/
    └── data/
        └── processed/
            ├── baseline/         # Stores 202 un-named WAV files (original dataset)
            ├── deep/             # Stores 211 Surah Al-Mulk WAV files (trimmed to 1m, 16kHz mono)
            └── high/             # Stores 212 Surah Ash-Shams WAV files (trimmed to 1m, 16kHz mono)
```

---

### 3. Implementation Details

#### **download_recitations.py**
- **HTML Card-Based Crawler**: Crawls the homepage of [mp3quran.net/eng](https://www.mp3quran.net/eng) to fetch all sheikh profile links (using elements with class `card-read`).
- **Resumable Downloads & Sanitization**: Checks the target folder before downloading to support resumes. Sheikh names are sanitized to a filename-safe string (replacing spaces with underscores and stripping invalid characters).
- **Windows Unicode Print Safety**: Reconfigures `sys.stdout` and `sys.stderr` to use UTF-8 with a replacement policy to prevent terminal encoding crashes when printing names containing non-ASCII symbols.

#### **Audio Conversion Pipeline**
- **Efficient Loading & Trimming**: Utilizes `librosa.load(..., duration=60.0, sr=16000, mono=True)` to decode and load only the first 60 seconds of the source MP3 directly into memory, resampled and mixed down to 16kHz mono.
- **Format Transcoding**: Uses `soundfile.write(..., subtype='PCM_16')` to write standard PCM 16-bit WAV files (exactly `1,920,044 bytes` for a full 60-second clip).
- **Folder Partitioning Logic**: Iterates over all WAV files, moving baseline sheikh files to `baseline/`, Al-Mulk files to `deep/`, and Ash-Shams files to `high/` using python's `shutil.move`.

---

### 4. Run & Execution History
- **2026-07-11 17:56**: Ran initial run of `download_recitations.py`. Processed 240 sheikhs before encountering a console encoding error on Arabic Unicode characters.
- **2026-07-11 18:16**: Reconfigured script console output handling and re-ran. Fast-forwarded through existing files and finished the remaining sheikhs.
  - **Status**: Completed successfully. Processed 241 sheikhs, downloaded 423 recitations (59 missing surahs expected, 0 errors). Output report saved to `download_report.txt`.
- **2026-07-11 18:45**: Ran `process_test1_audio.py` transcoder script.
  - **Status**: Completed successfully. Converted and trimmed 423 files to standard 16kHz mono WAV format and deleted original MP3 files.
- **2026-07-11 18:54**: Ran `organize_processed.py` to partition files.
  - **Status**: Completed successfully. Moved 202 files to `baseline`, 211 files to `deep`, and 212 files to `high`. Cleaned up temporary files.
- **2026-07-11 19:19**: Ran `normalize_all_audio.py` to perform amplitude normalization (Peak Normalization to max 1.0) on all 625 files in-place.
  - **Status**: Completed successfully (625 successes, 0 failures).
- **2026-07-11 19:42**: Ran optimized `extract_features_and_diagnostics.py` script.
  - **Status**: Completed successfully. Extracted 768-dimensional HuBERT speaker identity embeddings and DSP vocal diagnostics (F0 bounds, HNR, Jitter, Shimmer) for all 625 files, compiled [master_vector_matrix.json](file:///c:/Users/manaa/Documents/appagent/Itq%C4%81n/matcher/data/master_vector_matrix.json) (~14MB), and pushed all assets to GitHub.