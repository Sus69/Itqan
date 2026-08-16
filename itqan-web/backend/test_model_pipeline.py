import io
import wave
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

def test_full_pipeline():
    print("Testing Full API & ML Pipeline with Models...")
    with TestClient(app) as client:
        # 1. Health check
        h_res = client.get("/health")
        print("Health check response:", h_res.json())
        assert h_res.status_code == 200
        assert h_res.json()["matcher_loaded"] is True
        assert h_res.json()["tajweed_loaded"] is True

        # 2. Synthesize audio
        sr = 16000
        t = np.linspace(0, 2.0, int(sr * 2.0), endpoint=False)
        envelope = 0.5 * (1 + np.sin(2 * np.pi * 3 * t))
        audio = (envelope * 0.4 * np.sin(2 * np.pi * 300 * t)).astype(np.float32)

        wav_io = io.BytesIO()
        with wave.open(wav_io, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sr)
            wf.writeframes((audio * 32767).astype(np.int16).tobytes())
        wav_bytes = wav_io.getvalue()

        # 3. Voice Match Test
        print("\n--- Testing Voice Match API (WavLM SV) ---")
        res_match = client.post(
            "/api/v1/voice/match",
            files={"audio_file": ("sample.wav", wav_bytes, "audio/wav")},
            data={"top_k": 5}
        )
        print("Voice Match HTTP Status:", res_match.status_code)
        assert res_match.status_code == 200
        data_match = res_match.json()
        print(f"Matched {len(data_match.get('top_matches', []))} Qaris.")
        for idx, match in enumerate(data_match.get("top_matches", [])[:3]):
            print(f"  [{idx+1}] {match['qari_name']} ({match.get('arabic_name')}) -> Similarity: {match['similarity_percentage']}%")

        # 4. Audio Evaluation Test (Tarteel Whisper + CTC Alignment + DSP Rules)
        print("\n--- Testing Tajweed Audio Evaluation API (Tarteel Whisper + CTC) ---")
        res_eval = client.post(
            "/api/v1/audio/evaluate",
            files={"audio_file": ("sample.wav", wav_bytes, "audio/wav")},
            data={"expected_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "lesson_id": "6.1"}
        )
        print("Audio Eval HTTP Status:", res_eval.status_code)
        assert res_eval.status_code == 200
        data_eval = res_eval.json()
        print("Audio Eval response success:", data_eval.get("success"))
        eval_payload = data_eval.get("data", {})
        print("  - Overall Score:", eval_payload.get("overall_score"))
        print("  - Fluency Score:", eval_payload.get("fluency_score"))
        print("  - Pronunciation Score:", eval_payload.get("pronunciation_score"))
        print("  - Rule Compliance Score:", eval_payload.get("rule_compliance_score"))
        print("  - ASR Transcription:", eval_payload.get("asr_transcription"))
        print("  - Alignment Tokens Count:", len(eval_payload.get("alignment", [])))
        print("  - Detected Rule Mistakes:", len(eval_payload.get("mistakes", [])))

    print("\n✅ All ML Model Integration & API Endpoints Passed Successfully!")

if __name__ == "__main__":
    test_full_pipeline()
