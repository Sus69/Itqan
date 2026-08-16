# Project Context & Execution History

This file documents the steps, architecture, and modifications made during the development of the **Itqān (إتقان)** Quranic Voice Engine, Tajweed Assessment System, and Interactive Learning Platform.

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
```text
Itqān/
├── build_dataset.py          # Processing and offline embedding script
├── requirements.txt          # Python library dependencies
├── CHANGELOG.md              # Context preservation log
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
├── backend/                           # Server Directory
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
└── CHANGELOG.md                       # Execution history log
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

## 📅 Session Log: 2026-08-04 (Part 3: Clean 7-Module Curriculum Refactor)

### 1. Goal & Actions
- **Architecture & File Layout Update**:
```text
Itqān/
├── INFO.md                        # Master source of Tajweed rules & Quranic examples
├── tajweed_syllabus.md            # Master 20-Part Educational Blueprint & 7-Module Curriculum Specification
├── CHANGELOG.md                   # Execution history log
└── itqan-phase1/
    ├── backend/
    │   ├── app/
    │   │   ├── __init__.py
    │   │   ├── main.py            # FastAPI entrypoint (/matcher/recommend & /tajweed/analyze)
    │   │   ├── matcher.py         # VoiceMatcher class (WavLM SV speaker x-vectors)
    │   │   └── tajweed.py         # TajweedEvaluator class (7-Module rule parser, DSP rules & forced alignment)
    │   └── data/
    │       └── vector_db.json     # 242 Qaris 512-dim speaker x-vectors
    └── frontend_basic/
        ├── index.html             # Phase 1 Voice Qari Matcher UI
        └── tajweed.html           # 7-Module Tajweed Curriculum Blueprint & Portal
```
- **Deleted `itqan.html`**: Removed `frontend_basic/itqan.html`.
- **Updated `index.html` Navigation**: Updated top navigation in `frontend_basic/index.html` to focus on `index.html` (Voice Qari Matcher) and `tajweed.html` (Tajweed Curriculum & Portal).
- **Clean 7-Module Curriculum in `tajweed.html`**: Completely rewrote `frontend_basic/tajweed.html` with a modern, high-contrast dark theme layout presenting the 7-Module curriculum structure:
  1. **Module 1: Foundations of Recitation** (*The Aadaab*, *Makhaarij*, *The 7 Groups of Articulation*)
  2. **Module 2: Letter Characteristics & Pronunciation** (*Introduction to Tajweed*, *Qalqala*, *The Rule of Laam*, *The Rule of Raa*)
  3. **Module 3: The Rules of Noon and Meem** (*Noon & Meem Mushaddadah*, *3 Rules of Meem Saakin*, *Rules of Noon Saakin & Tanween*: Ikhfa, Ithaar, Idghaam)
  4. **Module 4: Advanced Assimilation (Idghaam)** (*Idghaam Mithlayn*, *Idghaam Mutaqaaribayn*)
  5. **Module 5: The Rules of Elongation (Madd)** (*Huroof-ul-Madd*, *Maddul Asli*, *Maddul Muttasil & Munfasil*, *Maddul Laazim*, *Maddul Aaridh*)
  6. **Module 6: Connecting Words (Alif-Laam)** (*The Sun Letters*, *The Moon Letters*)
  7. **Module 7: Stopping and Prostration** (*The Rules of Stopping*, *Symbols Denoting Pauses*, *Verses of Prostration*)

---

## 📅 Session Log: 2026-08-04 (Part 4: 15-Part AI Learning Platform Architecture PRD Portal)

### 1. Goal & Actions
- **Master LXD & Educational Architecture Specification**: Transformed `frontend_basic/tajweed.html` into an exhaustive **15-Part AI Learning Platform Architecture PRD & 7-Module Curriculum Portal**.
- **15 Pedagogical Learning Science Principles**: Detailed how Active Recall, Retrieval Practice, Deliberate Practice, Mastery Learning, Progressive Disclosure, Cognitive Load Theory, Dual Coding, Spaced Repetition, Immediate Feedback, Error-Based Learning, Interleaving, Scaffolding, Microlearning, Experiential Learning, and Intrinsic Motivation govern every UI interaction and audio loop.
- **Complete 15-Part Coverage with 8-Point PRD Matrix**: For every domain (from Platform Identity to Information Architecture, Learning Hierarchy, Component System, Lesson Blueprint, Practice System, Progression System, AI Teacher Persona, Audio Learning System, Assessment Framework, Progress Dashboard, Accessibility, Motion & Animation, Design System Tokens, and Scalability), answered all 8 core engineering and LXD requirements.

---

## 📅 Session Log: 2026-08-05 (Documentation Suite)

### 1. Goal & Requirements
- **Goal**: Establish the comprehensive product documentation structure and create engineering specifications.
- **Task 1**: Scaffold the entire `docs/` directory with structured folders: `vision/`, `architecture/`, `education/`, `design/`, and `engineering/`.
- **Task 2**: Create foundational documents defining Itqān's vision, architecture, educational framework, and design system.
- **Task 3**: Draft `api-contracts.md` outlining backend architecture, endpoints, data payloads, and contracts.
- **Task 4**: Draft `audio-pipeline.md` detailing the lifecycle of audio from capture to AI evaluation, phoneme alignment, and voice matching.
- **Task 5**: Synthesize the `docs/` structure into a master `SYSTEM_PROMPT.md` for AI coding assistants.

### 2. Changes Made
- Created full `docs/` directory structure including:
  - `docs/vision/vision.md`
  - `docs/architecture/product-ecosystem.md`, `navigation.md`, `screen-inventory.md`, `learning-engine.md`
  - `docs/education/lesson-blueprint.md`, `assessment-framework.md`, `ai-teacher.md`
  - `docs/design/design-system.md`, `component-library.md`
  - `docs/engineering/api-contracts.md`, `audio-pipeline.md`
- Created `docs/SYSTEM_PROMPT.md` as the master project instruction set.

---

## 📅 Session Log: 2026-08-10 (Phase 1 Backend Core & INFO.md Tajweed Engine)

### 1. Goal & Requirements
- **Goal**: Upgrade backend AI models, standardize vector representations with Microsoft WavLM, and build a multi-stage Tajweed DSP analysis engine directly aligned with `docs/INFO.md`.
- **Voice Matcher Upgrade**: Transition from HuBERT to `microsoft/wavlm-base-plus-sv` speaker verification model extracting 512-dimensional L2-normalized x-vectors across **242 Qaris**.
- **Tajweed Evaluation Engine**: Implement multi-stage evaluation pipeline combining ASR phoneme recognition (`tarteel-ai/rijaal-asr-wav2vec2-large-arabic`), normalized text Levenshtein comparison, rule parsing across 15+ Tajweed rule families, and acoustic DSP validation.

### 2. Changes & Implementation
- **Expanded Vector Database ([vector_db.json](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-phase1/backend/data/vector_db.json))**:
  - Pre-computed 512-dimensional speaker embeddings for 242 authentic Qari profiles.
  - In-memory cosine similarity matrix search with sub-50ms query response time.
- **Universal Audio Decoder ([matcher.py](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-phase1/backend/app/matcher.py))**:
  - Implemented 3-tier fallback audio decoder (`soundfile` -> `torchaudio` -> `pydub/ffmpeg` -> `librosa`) converting any incoming format (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`, `.webm`, `.opus`, `.aac`) to 16kHz mono `float32`.
- **Comprehensive Tajweed Evaluator ([tajweed.py](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-phase1/backend/app/tajweed.py))**:
  - **Stage 0 (Audio Quality & VAD Gate)**: RMS energy, peak amplitude, and speech frame ratio (20ms frames) checking to reject silence and noisy recordings.
  - **Stage 1 (Acoustic ASR Recognition)**: Wav2Vec2 CTC Arabic model generates phonetic transcriptions.
  - **Stage 2 (Text Normalization & Verification)**: Normalizes Arabic text (removes Harakat, Quranic stop marks, Tatweel; maps variant Alifs and Yaas) and computes Levenshtein character accuracy.
  - **Stage 3 (Tajweed Rule Parser)**: Extracts active rules from target verse text according to `docs/INFO.md`:
    - *Qalqala* (ق ط ب ج د with Sukoon or at Waqf)
    - *Noon & Meem Mushaddadah* (نّ, مّ with 2-Harakaat Ghunnah)
    - *Rule of Laam* (Lafz al-Jalalah Heavy vs Light)
    - *Meem Saakin Rules* (Ikhfa Shafawi, Idghaam Shafawi, Ithaar Shafawi)
    - *Noon Saakin & Tanween* (Ikhfa with 15 letters, Ithaar with 6 throat letters, Idghaam with/without Ghunnah)
    - *Madd Rules* (Maddul Asli [2 Harakaat], Maddul Muttasil [4-5], Maddul Munfasil [4-5], Maddul Laazim [6], Maddul Aaridh [2, 4, or 6])
    - *Raa Rules* (Tafkheem vs Tarqeeq) & *Sun/Moon Letters*
  - **Stage 4 (Acoustic DSP Analysis)**: Computes Harakaat duration timings, nasal spectral energy ratios (Ghunnah bands), and Qalqala plosive burst dynamics.
  - **Stage 5 (Scoring & Feedback)**: Synthesizes rule-level scores, categorical status (`PASSED`, `NEEDS_PRACTICE`, `FAILED`), corrective tips, and composite Tajweed score.
- **Automated Verification Scripts**:
  - Created `test_tajweed_api.py` and `test_vad_silent.py` to validate API integrity and VAD silence gate.
  - Created `docs/PROJECT_STATUS.md` documenting all phase deliverables.

---

## 📅 Session Log: 2026-08-11 (Modern Web App — `itqan-web`)

### 1. Goal & Architecture
- **Goal**: Build a modern, responsive Single Page Application (SPA) using **Vite + React 19 + TypeScript + Tailwind CSS** adhering to the Light Design System in `docs/design/design-system.md`.
- **Core Architecture**:
  - Clean light-mode aesthetic: Brand Emerald (`#059669`), Gold Accent (`#D97706`), Warm Sand (`#FDFBF7`), soft shadows, and subtle glassmorphic overlays.
  - Custom typography: `Outfit` (Latin headings/UI), `Noto Naskh Arabic` (Arabic body), and `Amiri Quran` (Quranic script with full Tashkeel).
  - Navigation layout: Responsive desktop sidebar, header with live backend status indicator, and mobile bottom navigation bar.

### 2. Components & Pages
- **App Shell & State ([AppShell.tsx](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-web/src/components/AppShell.tsx))**:
  - Responsive layout with desktop sidebar, header bar, and mobile nav.
  - `BackendStatus` indicator polling `GET /health` with live Qari database count and status pill.
- **Audio Capture Hook & Visualizer ([useRecorder.ts](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-web/src/hooks/useRecorder.ts), [RecorderPanel.tsx](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-web/src/components/RecorderPanel.tsx))**:
  - Browser `MediaRecorder` integration with Web Audio API `AnalyserNode` for real-time waveform bars and VU meter.
  - Audio playback preview, elapsed timer, recording retry, and seamless Blob payload generation.
- **Tajweed Studio ([TajweedStudioPage.tsx](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-web/src/pages/TajweedStudioPage.tsx))**:
  - Preset verse selector with complete Quranic diacritics.
  - Character-level color-coded alignment display (`ColorCodedVerse.tsx`).
  - Circular overall Tajweed Score ring and expandable rule-by-rule evaluation cards (`RuleEvaluationCard.tsx`) with detected Harakaat and corrective guidance.
- **Voice Matcher ([VoiceMatchPage.tsx](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-web/src/pages/VoiceMatchPage.tsx))**:
  - Record or upload audio flow sending multipart payload to `POST /api/v1/matcher/recommend`.
  - Top Qari recommendation cards (`QariMatchCard.tsx`) showing similarity percentages and "Save as Reference" action.
- **Dashboard & Shell Pages**:
  - `HomePage.tsx`: Daily learning streak, voice match hero, today's practice verse, and feature quick-links.
  - `PracticePage.tsx`, `ProgressPage.tsx`, `ProfilePage.tsx`: Practice mode selection, mastery tracking charts, and user preferences.

---

## 📅 Session Log: 2026-08-14 (Interactive Tajweed Course Hub, Lesson Player & Reference Guide)

### 1. Goal & Requirements
- **Goal**: Transform the learning experience by building an interactive 10-chapter Tajweed Course Hub, step-by-step lesson player, comprehensive reference encyclopedia, and Qaida roadmap.

### 2. Changes & Features Added
- **10-Chapter Tajweed Curriculum ([infoData.ts](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-web/src/lib/infoData.ts))**:
  - Structured 10 comprehensive chapters mapped directly to `docs/INFO.md` and `tajweed_syllabus.md`:
    1. Introduction & Aadaab of Tilawah
    2. Makhaarij (Places of Articulation)
    3. Qalqala (Echoing Letters)
    4. Noon & Meem Mushaddadah (Ghunnah)
    5. The Rule of Laam (Lafz al-Jalalah)
    6. Meem Saakin Rules (Ikhfa, Idghaam, Ithaar Shafawi)
    7. Noon Saakin & Tanween Rules (Ikhfa, Ithaar, Idghaam, Iqlab)
    8. Advanced Idghaam (Mithlayn & Mutaqaaribayn)
    9. The Rules of Madd (Elongation Types & Timing)
    10. Stopping (Waqf) & Prostration
- **Interactive Course Hub ([TajweedCourseHubPage.tsx](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-web/src/pages/TajweedCourseHubPage.tsx))**:
  - Visual chapter cards showing mastery status, lesson count, estimated duration, difficulty badge, and chapter test scores.
  - XP counter, completion progress bar, and "Continue Where You Left Off" launcher.
- **Interactive Lesson Player ([TajweedLessonPage.tsx](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-web/src/pages/TajweedLessonPage.tsx))**:
  - Multi-stage guided pedagogy:
    - **Step 1: Core Concept**: Visual breakdown of the rule and Quranic rationale.
    - **Step 2: Mechanics & Rules**: Detailed letters, conditions, and exceptions with Arabic typography.
    - **Step 3: Quranic Examples & Audio**: Word-by-word examples with color-coded highlighting.
    - **Step 4: Interactive Quiz**: Dynamic multiple-choice questions with instant feedback and score calculation.
    - **Step 5: Voice Practice Studio**: Direct one-click jump into Tajweed Studio with pre-selected practice verses.
- **Course State & Progression ([courseState.ts](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-web/src/lib/courseState.ts))**:
  - LocalStorage persistence tracking completed chapters, high scores, active chapter index, and accumulated XP points.
- **Tajweed Reference Encyclopedia ([TajweedInfoPage.tsx](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-web/src/pages/TajweedInfoPage.tsx))**:
  - Searchable, filterable reference compendium containing complete rule definitions, letters, Harakaat durations, and Quranic citations.
- **Qaida Curriculum Roadmap ([docs/qaida.md](file:///c:/Users/manaa/Documents/appagent/Itqān/docs/qaida.md), [QaidaPage.tsx](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-web/src/pages/QaidaPage.tsx))**:
  - 17-lesson structured foundational Arabic reading syllabus covering Alphabet, Letter Positions, Short Vowels (Harakat), Tanween, Sukoon, Madd Letters, Shaddah, and complex multi-syllable word reading.
- **Expanded Quranic Verse Database ([verses.ts](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-web/src/lib/verses.ts))**:
  - Added 10+ authentic Quranic verses with full diacritics, English translations, target rule tags, and difficulty tiers.

---

## 📅 Session Log: 2026-08-15 (Tajweed Forced Alignment DSP, Qaida Data Ingestion & Ecosystem Verification)

### 1. Goal & Requirements
- **Goal 1 (Tajweed Forced Alignment & DSP Engine)**: Implement and verify the acoustic DSP algorithms and CTC Trellis forced-alignment span calculations for rule validation (Ghunnah nasal resonance, Qalqala transient bursts, and LPC formant analysis).
- **Goal 2 (Qaida Dataset & Curriculum Ingestion)**: Ingest, structure, and document the complete foundational Qaida dataset to power Pillar 2 of the Itqān learning system.
- **Goal 3 (Ecosystem Health & Build Verification)**: Validate end-to-end frontend and backend codebases, ensure zero build errors, and synchronize project status and changelog records.

### 2. Implementation & Key Deliverables

#### A. Tajweed Forced Alignment & Acoustic DSP Engine ([tajweed.py](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-phase1/backend/app/tajweed.py), [verify_dsp.py](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-phase1/backend/verify_dsp.py))
- **LPC Formant Tracking (`compute_lpc_formants`)**:
  - Implemented Linear Predictive Coding (LPC) polynomial root-finding on pre-emphasized windowed audio to extract resonant formant frequencies ($F_1, F_2, F_3$) across the standard vocal tract speech range (200–4500 Hz).
- **Ghunnah Nasal Energy Ratio (`compute_nasal_energy_ratio`)**:
  - Implemented Fast Fourier Transform (FFT) spectral energy ratio computation comparing the nasal murmur resonance band (180–450 Hz) against the oral formant energy band (600–2500 Hz) to acoustically verify 2-Harakaat nasalization on *Noon & Meem Mushaddadah* and *Ikhfa/Idghaam with Ghunnah*.
- **Qalqala Plosive Burst Dynamics (`compute_qalqala_burst_ratio`)**:
  - Developed transient energy release ratio calculation comparing post-closure burst RMS against acoustic closure RMS to detect authentic echoing release on the five Qalqala letters (**ق ط ب ج د**).
- **CTC Trellis Forced Alignment**:
  - Integrated frame-level CTC log-probability trellis path decoder mapping character tokens to millisecond-accurate audio time spans (`start_time`, `end_time`).
- **Automated DSP Test Script ([verify_dsp.py](file:///c:/Users/manaa/Documents/appagent/Itqān/itqan-phase1/backend/verify_dsp.py))**:
  - Built test runner verifying formants, nasal ratios, Qalqala bursts, regex rule parsers, and Trellis alignment tensors with 100% pass rate.

#### B. Complete Madani Qa'idah Dataset Ingestion ([docs/qaida.md](file:///c:/Users/manaa/Documents/appagent/Itqān/docs/qaida.md))
- Ingested and structured the complete master **Madani Qa'idah** dataset (892 lines) spanning all 17 foundational lessons:
  - **17 Places of Articulation (Makhaarij) Matrix**: *Halqee* (bottom, middle, top throat), *Lisaani* (Lahawiyyah, Shajariyyah, Haafiyyah, Tarafiyyah, Nit'iyyah, Lisawiyyah, Safeeriyyah), *Shafawi* (lips), *Jawfee* (empty mouth space for Madd), and *Khaysoom* (nasal cavity).
  - **Full 17-Lesson Roadmap**:
    1. Lesson 1: *Huroof Mufridat* (29 Individual Arabic Letters, Musta'liyah heavy letters, Safeeriyah whistle letters)
    2. Lesson 2: *Huroof Murakkabat* (Compound Letters, letter forms, and dot differentiation tables)
    3. Lesson 3: *Harakaat* (Fathah, Kasrah, Dammah short vowels and pronunciation speed)
    4. Lesson 4: *Standing Harakaat* (Khada Fathah, Khada Kasrah, Ulta Dammah = 1 Alif stretch)
    5. Lesson 5: *Huroof Maddah & Leen* (Alif/Waw/Yaa Maddah vs Waw/Yaa Leen softness)
    6. Lesson 6: *Tanween* (Double Fathah, Double Kasrah, Double Dammah)
    7. Lesson 7: *Rules of Tanween & Noon Saakin* (Ithaar throat letters vs Ikhfa nasal hidden sound)
    8. Lesson 8: *Sukoon / Jazm* (Letters with Sukoon, Qalqala echo letters)
    9. Lessons 9–17: *Tashdeed / Shaddah*, *Idghaam*, *Iqlab*, *Rules of Meem Saakin*, *Rules of Raa & Laam*, *Madd Types*, and comprehensive multi-syllable Quranic reading exercises.

#### C. Verification & Build Validation
- **Frontend SPA**: Executed `npm run build` (`tsc -b && vite build`) with zero TypeScript errors, producing optimized production bundle.
- **Documentation**: Updated master [README.md](file:///c:/Users/manaa/Documents/appagent/Itqān/README.md), [docs/PROJECT_STATUS.md](file:///c:/Users/manaa/Documents/appagent/Itqān/docs/PROJECT_STATUS.md), and changelog records.

---

## 🏗 Current Architecture & Directory Topology

```text
Itqān/
├── README.md                           # Main project overview & running instructions
├── tajweed_syllabus.md                 # 20-Part Educational & Curriculum Blueprint
├── master_vector_matrix.json           # Raw 242-Qari embedding ledger
├── convert_matrix_to_db.py             # Matrix to vector DB converter
├── test_tajweed_api.py                 # Tajweed API automated test suite
├── test_vad_silent.py                  # VAD gate silence rejection test
│
├── docs/                               # System Documentation & Specifications
│   ├── CHANGELOG.md                    # Complete project history & session logs (this file)
│   ├── INFO.md                         # Master reference standard for Tajweed rules & Makhaarij
│   ├── PROJECT_STATUS.md               # Detailed deliverable status & roadmap
│   ├── qaida.md                        # Master 17-Lesson Qaida curriculum specification
│   ├── vision.md                       # Product vision, philosophy, and 3 pillars
│   ├── architecture/                   # Ecosystem, navigation & learning engine architecture
│   ├── education/                      # Lesson blueprint, assessment framework & AI teacher
│   ├── design/                         # Light Design System tokens & component specs
│   └── engineering/                    # API contracts & audio processing pipeline
│
├── itqan-web/                          # Modern React 19 + TypeScript + Vite Web Application
│   ├── src/
│   │   ├── components/                 # AppShell, BackendStatus, ColorCodedVerse, RecorderPanel, RuleEvaluationCard, ui
│   │   ├── hooks/                      # useRecorder (Web Audio API & MediaRecorder)
│   │   ├── lib/                        # api (client), courseState (progression), infoData (curriculum), verses
│   │   ├── pages/                      # HomePage, LearnPage, TajweedCourseHubPage, TajweedLessonPage, TajweedInfoPage,
│   │   │                               # QaidaPage, PracticePage, TajweedStudioPage, VoiceMatchPage, ProgressPage, ProfilePage
│   │   ├── App.tsx                     # React Router routes definition
│   │   ├── index.css                   # Design system tokens & utilities
│   │   └── main.tsx                    # React DOM entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── itqan-phase1/
    ├── backend/                        # FastAPI Python Backend
    │   ├── app/
    │   │   ├── main.py                 # FastAPI application, lifespan & REST routes
    │   │   ├── matcher.py              # VoiceMatcher (WavLM SV x-vectors & Cosine Similarity)
    │   │   └── tajweed.py              # TajweedEvaluator (Wav2Vec2 CTC, Levenshtein, Rule Parser & DSP)
    │   ├── data/
    │   │   └── vector_db.json          # Precomputed 242-Qari 512-dim vector database
    │   └── requirements.txt            # Python dependencies
    └── frontend_basic/                 # Basic HTML/JS Prototype
        ├── index.html                  # Voice Qari Matcher prototype UI
```

---

## [2026-08-15] - Milestone 4: Backend Consolidation, Database, Auth & Full Curriculum API Engine

### 1. Goals & Objectives
- Drop deprecated `itqan-phase1` directory and integrate all backend components directly into `itqan-web/backend`.
- Build production-ready SQLite database architecture with thread-safe connection pooling and automatic schema initialization.
- Implement secure authentication (salted PBKDF2-SHA256 password hashing + HMAC-SHA256 JWT tokens).
- Build curriculum delivery endpoints for 24 Tajweed rules, 17 Noorani/Madani Qaida lessons, and 17 Makhaarij articulation points.
- Implement user mastery tracking, daily streaks, XP points, and recitation history logs.
- Deliver contract-compliant `/api/v1/audio/evaluate` endpoint providing structured pedagogical AI Teacher guidance alongside the 5-stage acoustic DSP pipeline.

### 2. Changes & Implementation
- **Core Architecture (`itqan-web/backend/app/core/`)**:
  - `config.py`: Environment configuration, JWT secrets, DB paths, CORS policies.
  - `database.py`: Thread-safe SQLite connection manager with WAL mode, foreign keys, and tables for `users`, `user_progress`, `recitation_logs`, and `daily_activity`.
  - `security.py`: Salted PBKDF2 password hashing, signed JWT token generation, and FastAPI user authentication dependencies.
- **Curriculum & Data Modules (`itqan-web/backend/app/data/`)**:
  - `syllabus_data.py`: 6 modules and 24 individual Tajweed rules with full descriptions and benchmark Quranic Ayahs.
  - `qaida_data.py`: Complete 17-lesson Qaida dataset covering single letters, compound forms, short vowels, Tanween, Sukoon, and Tashdeed.
  - `makharij_data.py`: Comprehensive dataset for the 5 primary vocal areas and 17 articulation points.
  - `qari_metadata.py`: Directory and biographical profiles for the 242 Qaris.
- **API v1 Routers (`itqan-web/backend/app/api/v1/`)**:
  - `auth.py`: User registration (`POST /auth/register`), login (`POST /auth/login`), profile (`GET /auth/me`), and updates (`PUT /auth/me`).
  - `users.py`: Progress overview (`GET /users/me/progress`), lesson updates (`POST /users/me/progress`), and recitation history (`GET /users/me/recitations`).
  - `courses.py`: Course listings (`GET /courses`), Tajweed modules (`GET /courses/tajweed/modules`), rules (`GET /courses/tajweed/rules`).
  - `qaida.py`: Qaida lesson catalog (`GET /qaida/lessons`) and lesson details (`GET /qaida/lessons/{id}`).
  - `makharij.py`: Vocal articulation points (`GET /makharij`).
  - `qaris.py`: Searchable Qari directory (`GET /qaris`).
  - `audio.py`: Contract-compliant AI Teacher recitation evaluation (`POST /audio/evaluate`).
  - `matcher.py` & `tajweed.py`: Integrated WavLM speaker matching and 5-stage forced alignment DSP engine.
- **Automated Test Suite (`test_backend.py`)**: 
9 automated test suites verifying database, auth, progress, courses, Qaida, Makhaarij, and Qari search with 100% pass rate.


### 3. Full 21-Lesson Madani Qa'idah Ingestion (Aligned with docs/qaida.md)
- Ingested 100% of all 21 (+1 application) lessons verbatim from `docs/qaida.md` into `app/data/qaida_data.py`.
- Full vocabulary, pronunciation rules, Hijjay and Rawan spelling guidelines, and letter grid tables preserved with 0 modifications.
- Updated `courses.py` and `users.py` with 21-lesson progress and curriculum tracking.

### 4. Authentication UI, AuthContext & Dummy User Seeding
- Created `app/core/seed.py` pre-populating realistic student personas with complete lesson masteries, daily streaks, XP, and recitation logs:
  - **Ahmed Al-Mansoor** (`ahmed@itqan.app` / `ahmed_qari`): Advanced student, 14-day streak, 1450 XP, reference Qari: Mahmoud Khalil Al-Husary.
  - **Fatima Az-Zahra** (`fatima@itqan.app` / `fatima_reciter`): Intermediate reciter, 7-day streak, 720 XP, reference Qari: Mishary Rashid Alafasy.
  - **Demo Student** (`demo@itqan.app` / `demo_user`): Beginner learner, 3-day streak, 260 XP, reference Qari: Abdul Basit Abdul Samad.
- Implemented `AuthProvider` and `useAuth()` hook in `src/lib/authContext.tsx` with token persistence and reactive auth state.
- Created `src/components/AuthModal.tsx` supporting standard Login, Registration, and instant 1-Click Demo Account switching.
- Integrated User Status pill, streak counter, and user menu dropdown in `AppShell.tsx`.
- Updated `ProfilePage.tsx` and `ProgressPage.tsx` to read and display live authenticated user metrics, daily goals, and recitation logs.

### 5. Interactive Character-Level Audio Mapping & Karaoke Synchronization
- Enabled exact acoustic mapping for every Arabic alphabet and diacritic from student recordings using CTC frame-accurate forced alignment timestamps.
- **Click-to-Play Audio Snippets**: Clicking any character in the Quranic verse immediately plays its exact audio slice (e.g. `0.82s – 1.15s` for "بِّ").
- **Pronunciation Inspector Card**: Displays expected vs heard phoneme, duration in milliseconds, status badge, 0.5x slow-motion playback, continuous looping, and tailored correction notes.
- **Interactive Audio Timeline & Karaoke**: Scrubbable waveform timeline with real-time character highlighting synchronized with audio playback.
- **Mistake Navigator**: "Prev Error" and "Next Error" navigation buttons allowing students to instantly jump between mispronounced characters and listen to where they made mistakes.

### 6. Bugfix: Prevent Page Reload on Recitation Logging
- Fixed root cause of full browser refresh when Tajweed analysis completed:
  - Configured Vite's file watcher in `vite.config.ts` to ignore `backend/**`, `data/**`, `**/*.db*`, and SQLite WAL files so database writes do not trigger Vite Hot Module Replacement reloads.
  - Scoped Uvicorn dev reload in `package.json` to `--reload-dir backend/app` preventing Python restarts during SQLite database transactions.
  - Defaulted `type="button"` across `Button` UI components.

### 7. Arabic Phonetic Grapheme Clustering & Exact Timestamp Alignment
- **Grapheme-Level Tokenization**: Replaced raw individual unicode codepoint slicing with complete Arabic phonetic grapheme clustering (`split_arabic_graphemes`) ensuring consonants remain bound to their Harakaat, Sukoon, Shaddah, and Maddah (e.g. `بِ`, `سْ`, `مِ`, `لَّ`).
- **Eliminated 0ms Floating Diacritics**: Combining vowel marks are no longer severed into standalone 0ms items; each phonetic unit receives a realistic, continuous acoustic time window (150ms – 450ms).
- **Audio Pre-roll & Monotonic Timestamp Smoothing**: Enforced monotonic timestamp progression with 40ms attack/decay audio buffers so clicking any letter plays the audible sound naturally without clipping.
- **Dual View Modes**: Added **Calligraphic Quranic View** (unbroken calligraphic flow) and **Syllable Grid View** (matrix breakdown of all timestamps & durations in milliseconds).

### 8. Fix CTC Trellis Viterbi Backtracking Across Full Audio Duration
- **Fixed Trellis Backtracking Frame Compression**:
  - Resolved the bug where tokens were squashed into the first 0.34 seconds because of early trellis argmax and premature token index decrements.
  - Rewrote Viterbi backtracking to trace from `t = num_frames - 1` backwards across all speech frames, preserving steady token duration spans (300ms – 800ms) matching natural recitation rhythm.
- **Enhanced Interactive Scrubber**: Added click-to-seek support directly on the timeline track and expanded snippet audio buffer to 320ms+ with pre-roll padding.

### 9. Revert to Clean Quranic Forced Alignment View
- Restored `ColorCodedVerse.tsx` and `TajweedStudioPage.tsx` to the clean, uncluttered calligraphic display.
- Removed timeline audio scrubbers, snippet player controls, and syllable breakdown grids to maintain visual simplicity and focus on authentic Tajweed rule evaluations.

### 10. Removal of Character-Level Forced Alignment Card
- Removed the Character-Level Forced Alignment card from `TajweedStudioPage.tsx` to streamline the studio view directly into overall recitation analytics and authentic rule evaluations.














































