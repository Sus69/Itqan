# API Contracts & Backend Architecture

> Version: 1.0
> Status: Draft
> Purpose: Defines the backend architecture, API endpoints, data payloads, and data contracts for Itqān. This document serves as a reference for client-server communication across the Learning, Audio, and Voice Matching systems.

---

# 1. Architecture Overview

The Itqān backend is designed to support a seamless, real-time learning experience, particularly around AI evaluation and audio processing. 

The architecture is divided into the following core domains:
- **User Management & Progress:** Profiles, learning history, and mastery tracking.
- **Content Delivery:** Serving courses, modules, chapters, and lessons (Qaida, Tajweed).
- **AI Audio Evaluation:** Processing user recitation, identifying mistakes, and generating AI Teacher feedback.
- **Voice Matching:** Analyzing user vocal characteristics and comparing them against the Qari embeddings database.

---

# 2. Global Conventions

### 2.1 Base URL & Versioning
All API endpoints are prefixed with the current version:
`https://api.itqan.app/v1`

### 2.2 Authentication
All protected endpoints require a JWT (JSON Web Token) passed in the Authorization header:
`Authorization: Bearer <token>`

### 2.3 Standard Response Format
**Success Response (2xx):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response (4xx, 5xx):**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable error message."
  }
}
```

---

# 3. User & Progress Domains

## 3.1 Get User Profile
`GET /users/me`

Retrieves the current user's profile, including their selected reference Qari and overall progress stats.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "name": "Ahmed",
    "reference_qari_id": "qri_456",
    "joined_at": "2026-01-15T10:00:00Z"
  }
}
```

## 3.2 Update User Progress
`POST /users/me/progress`

Updates the user's progress after a lesson or practice session is completed.

**Request Payload:**
```json
{
  "lesson_id": "lsn_789",
  "status": "completed",
  "score": 92
}
```

---

# 4. Learning & Content Domains

## 4.1 Fetch Course Modules
`GET /courses/{course_id}/modules`

Fetches the modules for a specific course (e.g., Qaida or Tajweed).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mod_1",
      "title": "Arabic Alphabet",
      "order": 1,
      "is_locked": false
    }
  ]
}
```

## 4.2 Fetch Lesson Details
`GET /lessons/{lesson_id}`

Fetches the content, practice materials, and rules for a specific lesson.

---

# 5. Audio & AI Evaluation Domain

*Note: For detailed pipeline mechanics, refer to `audio-pipeline.md`.*

## 5.1 Evaluate Recitation
`POST /audio/evaluate`

Submits an audio recording for AI evaluation against an expected text or Tajweed rule.

**Headers:**
`Content-Type: multipart/form-data`

**Form Fields:**
- `audio_file`: (Binary audio data, preferably highly compressed .m4a or .ogg)
- `lesson_id`: "lsn_789"
- `expected_text`: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"

**Response Payload (`EvaluationResult` Contract):**
```json
{
  "success": true,
  "data": {
    "evaluation_id": "eval_001",
    "overall_score": 85,
    "fluency_score": 90,
    "pronunciation_score": 80,
    "mistakes": [
      {
        "word": "الرَّحْمَٰنِ",
        "mistake_type": "pronunciation",
        "severity": "medium",
        "expected_phoneme": "ḥ",
        "actual_phoneme": "h",
        "ai_teacher_feedback": "Make sure the 'Haa' (ح) comes from the middle of the throat. Try tightening your throat slightly."
      }
    ],
    "mastery_achieved": false
  }
}
```

---

# 6. Voice Matching Domain

## 6.1 Analyze Voice & Match
`POST /voice/match`

Analyzes the user's raw vocal characteristics and compares them to the reference database to find the closest matching Qari.

**Headers:**
`Content-Type: multipart/form-data`

**Form Fields:**
- `audio_file`: (Binary audio data, ~30-60 seconds of recitation)

**Response Payload:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "qari_id": "qri_01",
        "name": "Mahmoud Khalil Al-Husary",
        "confidence_score": 94.5,
        "match_reasons": ["Similar pitch", "Matching tempo"]
      },
      {
        "qari_id": "qri_02",
        "name": "Mishary Rashid Alafasy",
        "confidence_score": 88.2,
        "match_reasons": ["Similar tone"]
      }
    ]
  }
}
```

---

# 7. Data Contracts (Entities)

### 7.1 `User`
- `id` (String)
- `name` (String)
- `reference_qari_id` (String | null)
- `created_at` (Timestamp)

### 7.2 `Mistake`
- `word` (String) - The exact word where the error occurred.
- `mistake_type` (Enum: `pronunciation`, `tajweed_rule`, `fluency`)
- `severity` (Enum: `low`, `medium`, `high`)
- `ai_teacher_feedback` (String) - Personalized, contextual advice.

### 7.3 `Qari`
- `id` (String)
- `name` (String)
- `style_description` (String)
- `audio_samples` (Array of Strings/URLs)
