# Audio & AI Pipeline

> Version: 1.0
> Status: Draft
> Purpose: Defines the lifecycle of audio inside Itqān, detailing how raw user voice recordings are transformed into phoneme-level AI evaluations, Tajweed feedback, and voice-matching comparisons.

---

# 1. Pipeline Overview

The Audio Engine is the heart of Itqān’s interactive learning experience. It handles two primary workflows:
1. **AI Evaluation (Qaida & Tajweed):** Assessing user recitation for accuracy and generating feedback.
2. **Voice Matching:** Extracting vocal characteristics to match the user with a reference Qari.

The general flow is:
`Capture ➔ Preprocessing ➔ Inference (Alignment/Embeddings) ➔ Scoring ➔ Feedback Generation`

---

# 2. Stage 1: Capture & Preprocessing (Client)

To minimize latency and ensure high accuracy, audio preprocessing begins on the user's device.

### 2.1 Recording Specifications
- **Format:** Highly compressed but lossless-capable formats (e.g., `.m4a` or `.ogg`) for network transfer.
- **Sample Rate:** 16 kHz Mono (Industry standard for speech models, reduces payload size while preserving necessary phonetic details).

### 2.2 Client-Side Processing
- **Voice Activity Detection (VAD):** Trims leading and trailing silence to avoid uploading dead air.
- **Noise Suppression:** Basic noise gating to remove background hums before compression.

---

# 3. Stage 2: Ingestion & Normalization (Backend)

Once the payload reaches the API (`POST /audio/evaluate` or `POST /voice/match`), the backend prepares it for the ML models.

- **Validation:** Checks file integrity, minimum duration, and formatting.
- **Normalization:** Converts all incoming audio to a standardized format (16kHz, 16-bit PCM WAV) to guarantee consistency across different AI models.

---

# 4. Stage 3A: AI Evaluation & Phoneme Alignment (Learning)

When a user submits audio for a Tajweed or Qaida lesson, the pipeline must determine *exactly* how they pronounced each letter.

### 4.1 Expected Text Mapping
The system retrieves the "Expected Text" (the exact Ayah, word, or letter) from the lesson data. 

### 4.2 Forced Phoneme Alignment
Using a specialized acoustic model trained on Quranic Arabic:
- The model takes the normalized audio and the expected text.
- It performs **Forced Alignment**, mapping exact timestamps to specific phonemes (e.g., `[0.5s - 0.8s]: 'ح'`).

### 4.3 Feature Extraction
For Tajweed, pronunciation alone is not enough. The pipeline extracts acoustic features for specific rules:
- **Duration:** For *Madd* (elongation) and *Ghunnah* (nasalization).
- **Pitch/Frequency:** To detect heavy vs. light letters (*Tafkheem* and *Tarqeeq*).

---

# 5. Stage 4A: Scoring & AI Teacher Feedback

### 5.1 Mistake Detection
The extracted phonemes and features are compared against an ideal phonetic matrix:
- **Substitution Errors:** User said 'س' (Sin) instead of 'ص' (Sad).
- **Duration Errors:** User held a *Madd* for 2 beats instead of 4 beats.
- **Fluency:** Unnecessary pauses or stuttering.

### 5.2 The Scoring Engine
Scores are aggregated into three categories:
1. **Pronunciation Score:** Accuracy of the letters.
2. **Tajweed Score:** Adherence to rules.
3. **Fluency Score:** Flow and pace.

### 5.3 AI Teacher Generation
Instead of just returning a score, the pipeline generates contextual advice.
*Example Mapping:* If `actual_phoneme == "h"` and `expected_phoneme == "ḥ"`, the AI Teacher service appends: `"Make sure the 'Haa' comes from the middle of the throat."`

---

# 6. Stage 3B & 4B: Voice Matching Pipeline (Discovery)

When a user wants to find their reference Qari, the audio bypasses phoneme alignment and enters the Voice Matching track.

### 6.1 Speaker Embedding Extraction
- The audio is fed into a speaker verification/recognition model (e.g., using x-vectors or d-vectors).
- The model generates a high-dimensional mathematical representation (an **Embedding**) of the user's unique vocal characteristics (timbre, natural pitch, resonance).

### 6.2 Database Comparison
- The user's embedding is compared against a pre-computed database of Qari embeddings.
- **Cosine Similarity** is used to calculate the distance between the user's voice and each Qari's voice.

### 6.3 Ranking
- The pipeline ranks the Qaris based on the highest similarity scores.
- The top results are returned to the user, allowing them to preview and select their lifelong reference Qari.
