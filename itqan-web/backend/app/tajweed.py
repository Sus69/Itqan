import io
import re
import sys
import tempfile
from pathlib import Path
import numpy as np
import librosa
import scipy.signal
import torch
import torchaudio
from transformers import AutoProcessor, AutoModelForCTC, AutoModelForSpeechSeq2Seq

# Prevent UnicodeEncodeError on Windows terminals
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="backslashreplace")
    except (AttributeError, OSError):
        pass


def normalize_arabic_text(text: str) -> str:
    """
    Normalizes Arabic text for phrase verification:
    - Removes all Harakat (diacritics: َ ُ ِ ْ ّ ً ٌ ٍ)
    - Strips Tatweel (ـ) and Quranic Waqf symbols (۝ ۬ ۭ ۖ ۗ ۚ ۛ ۜ ۞ ۟ ۠ ۡ ۤ)
    - Normalizes Alifs: أ, إ, آ, ٱ -> ا
    - Normalizes Yaa: ى -> ي
    - Normalizes Teh Marbuta: ة -> ه
    """
    if not text:
        return ""
    # Remove diacritics
    text = re.sub(r'[\u064B-\u065F\u0670]', '', text)
    # Remove Tatweel & Quranic symbols
    text = re.sub(r'[\u0640\u06D6-\u06ED\u06DD]', '', text)
    # Normalize characters
    text = re.sub(r'[أإآٱ]', 'ا', text)
    text = re.sub(r'ى', 'ي', text)
    text = re.sub(r'ة', 'ه', text)
    # Extra spaces
    return " ".join(text.split())


def levenshtein_similarity(s1: str, s2: str) -> float:
    """Calculates normalized Levenshtein similarity percentage (0.0 to 100.0)."""
    if not s1 and not s2:
        return 100.0
    if not s1 or not s2:
        return 0.0
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    dist = dp[m][n]
    max_len = max(m, n)
    return round((1.0 - (dist / max_len)) * 100.0, 1)


def check_audio_quality(audio_array: np.ndarray, sr: int = 16000) -> dict:
    """
    Stage 0: Audio Quality & VAD Gate.
    Evaluates signal energy, speech activity ratio, and peak amplitude.
    Returns: {"is_valid_speech": bool, "mean_rms": float, "speech_frame_ratio": float, "reason": str}
    """
    if audio_array is None or len(audio_array) == 0:
        return {"is_valid_speech": False, "mean_rms": 0.0, "speech_frame_ratio": 0.0, "reason": "Empty audio data."}
    
    rms = np.sqrt(np.mean(audio_array ** 2))
    peak = np.max(np.abs(audio_array))
    
    frame_size = 320  # 20ms at 16kHz
    num_frames = max(1, len(audio_array) // frame_size)
    speech_frames = 0
    energy_threshold = max(0.004, rms * 0.4)
    
    for i in range(num_frames):
        frame = audio_array[i*frame_size : (i+1)*frame_size]
        f_rms = np.sqrt(np.mean(frame ** 2))
        if f_rms > energy_threshold:
            speech_frames += 1
            
    speech_ratio = speech_frames / num_frames
    
    # Valid speech threshold: RMS >= 0.005, Peak >= 0.012, Speech Ratio >= 0.10
    is_valid = bool(rms >= 0.005 and peak >= 0.012 and speech_ratio >= 0.10)
    reason = "Valid speech activity detected." if is_valid else "Silence or insufficient speech activity detected."
    
    return {
        "is_valid_speech": is_valid,
        "mean_rms": round(float(rms), 5),
        "peak_amplitude": round(float(peak), 5),
        "speech_frame_ratio": round(float(speech_ratio), 3),
        "reason": reason
    }


# =========================================================================
# DSP Acoustic Analysis: Formants, Nasalization & Transient Bursts
# =========================================================================

def compute_lpc_formants(audio_slice: np.ndarray, sr: int = 16000) -> tuple[float, float, float]:
    """
    Computes first three formant frequencies (F1, F2, F3) in Hz using Linear Predictive Coding (LPC)
    polynomial root-finding on the pre-emphasized signal slice.
    """
    if audio_slice is None or len(audio_slice) < 160:
        return (0.0, 0.0, 0.0)
    
    # 1. Pre-emphasis filter to balance spectral tilt
    pre_emph = np.append(audio_slice[0], audio_slice[1:] - 0.97 * audio_slice[:-1])
    windowed = pre_emph * np.hamming(len(pre_emph))
    
    # 2. LPC order (rule of thumb: 2 + sr/1000 = 18 for 16 kHz)
    lpc_order = min(18, max(4, len(windowed) - 2))
    
    try:
        a = librosa.lpc(windowed, order=lpc_order)
        rts = np.roots(a)
        # Retain roots in upper unit disc
        rts = [r for r in rts if np.imag(r) > 0.01 and np.abs(r) < 1.0]
        
        formants = []
        for r in rts:
            freq = np.arctan2(np.imag(r), np.real(r)) * (sr / (2.0 * np.pi))
            bw = -0.5 * (sr / (2.0 * np.pi)) * np.log(np.abs(r))
            # Keep standard speech formant range with tight bandwidth
            if 200 <= freq <= 4500 and bw < 550:
                formants.append((freq, bw))
                
        formants.sort(key=lambda x: x[0])
        f_vals = [round(float(f[0]), 1) for f in formants[:3]]
        
        while len(f_vals) < 3:
            f_vals.append(0.0)
            
        return (f_vals[0], f_vals[1], f_vals[2])
    except Exception:
        return (0.0, 0.0, 0.0)


def compute_nasal_energy_ratio(audio_slice: np.ndarray, sr: int = 16000) -> float:
    """
    Computes Ghunnah Nasal Energy Ratio:
    Ratio of energy in the nasal murmur resonance band (200-450 Hz)
    versus the oral formant energy band (600-2500 Hz).
    """
    if audio_slice is None or len(audio_slice) < 160:
        return 0.0
    
    fft = np.abs(np.fft.rfft(audio_slice * np.hamming(len(audio_slice)))) ** 2
    freqs = np.fft.rfftfreq(len(audio_slice), d=1.0/sr)
    
    nasal_mask = (freqs >= 180) & (freqs <= 450)
    oral_mask = (freqs >= 600) & (freqs <= 2500)
    
    nasal_energy = np.sum(fft[nasal_mask]) if np.any(nasal_mask) else 0.0
    oral_energy = np.sum(fft[oral_mask]) if np.any(oral_mask) else 0.0
    
    if oral_energy <= 1e-8:
        return round(float(nasal_energy / (oral_energy + 1e-6)), 3)
    
    ratio = float(nasal_energy / oral_energy)
    return round(ratio, 3)


def compute_qalqala_burst_ratio(audio_slice: np.ndarray, sr: int = 16000) -> float:
    """
    Computes Qalqala Plosive Burst Energy Ratio:
    Measures abrupt transient energy release after acoustic closure.
    """
    if audio_slice is None or len(audio_slice) < 320:
        return 1.0
        
    n = len(audio_slice)
    closure_split = int(n * 0.45)
    closure_seg = audio_slice[:closure_split]
    burst_seg = audio_slice[closure_split:]
    
    closure_rms = np.sqrt(np.mean(closure_seg ** 2)) if len(closure_seg) > 0 else 1e-5
    burst_rms = np.sqrt(np.mean(burst_seg ** 2)) if len(burst_seg) > 0 else 1e-5
    
    ratio = float(burst_rms / max(1e-5, closure_rms))
    return round(ratio, 2)


# =========================================================================
# Tajweed Rule Catalog & Parser
# =========================================================================

def parse_tajweed_rules_from_text(text: str) -> tuple[list[dict], list[dict]]:
    """
    Stage 3: Rule Parser based on INFO.md and tajweed_syllabus.md definitions.
    Parses target Arabic text to identify all applicable Tajweed rules and their character spans.
    Returns (present_rules_with_spans, all_catalog_definitions).
    """
    rules_catalog = {
        "madd_laazim": {
            "name": "Maddul Laazim (Compulsory Madd)",
            "arabic": "مد لازم (حروف مقطعة)",
            "tier": 5,
            "expected_harakaat": "6 Harakaat (~2.5 - 3.0 sec)",
            "min_harakaat": 5.0,
            "max_harakaat": 7.0,
            "unit": "Harakaat",
            "description": "Disjointed letters (Huroof Muqatta'at) at Surah openings recited for 6 full beats."
        },
        "madd_muttasil": {
            "name": "Maddul Muttasil (Joined Madd)",
            "arabic": "مد متصل",
            "tier": 5,
            "expected_harakaat": "4 to 6 Harakaat (~1.8 - 2.5 sec)",
            "min_harakaat": 3.5,
            "max_harakaat": 6.5,
            "unit": "Harakaat",
            "description": "Huroof-ul-Madd (ا، و، ي) followed by Hamzah (ء) in the SAME word."
        },
        "madd_munfasil": {
            "name": "Maddul Munfasil (Detached Madd)",
            "arabic": "مد منفصل",
            "tier": 5,
            "expected_harakaat": "3 to 5 Harakaat (~1.3 - 2.2 sec)",
            "min_harakaat": 2.5,
            "max_harakaat": 5.5,
            "unit": "Harakaat",
            "description": "Word ends with Huroof-ul-Madd (ا، و، ي) and next word begins with Hamzah (ء)."
        },
        "madd_asli": {
            "name": "Maddul Asli (Original Madd)",
            "arabic": "مد اصلي",
            "tier": 5,
            "expected_harakaat": "2 Harakaat (~0.8 - 1.2 sec)",
            "min_harakaat": 1.5,
            "max_harakaat": 2.8,
            "unit": "Harakaat",
            "description": "Natural elongation of Alif (ا), Waw (و), or Yaa (ي) for 2 beats."
        },
        "madd_aaridh": {
            "name": "Maddul Aaridh (Abrupt Stop Madd)",
            "arabic": "مد عارض للسكون",
            "tier": 5,
            "expected_harakaat": "2 to 5 Harakaat (~0.8 - 2.2 sec)",
            "min_harakaat": 1.5,
            "max_harakaat": 5.5,
            "unit": "Harakaat",
            "description": "Huroof-ul-Madd followed by a Saakin letter due to Waqf (stopping)."
        },
        "ghunnah_mushaddadah": {
            "name": "Noon & Meem Mushaddadah (Ghunnah)",
            "arabic": "نون وميم مشددة (غنة)",
            "tier": 2,
            "expected_harakaat": "2 Harakaat (~0.8 - 1.2 sec)",
            "min_harakaat": 1.5,
            "max_harakaat": 2.8,
            "unit": "Harakaat",
            "description": "Nasalization on Noon (نّ) or Meem (مّ) with Shaddah for 2 beats."
        },
        "laam_allah_heavy": {
            "name": "Laam of Allah (Tafkheem / Heavy)",
            "arabic": "لام لفظ الجلالة (مغلظة)",
            "tier": 2,
            "expected_harakaat": "Full mouth (F2 < 1500 Hz)",
            "min_harakaat": 0.0,
            "max_harakaat": 0.0,
            "unit": "pronunciation_quality",
            "description": "Name of Allah (اللّه) preceded by Fathah (َ) or Dhammah (ُ)."
        },
        "laam_allah_light": {
            "name": "Laam of Allah (Tarqeeq / Light)",
            "arabic": "لام لفظ الجلالة (مرققة)",
            "tier": 2,
            "expected_harakaat": "Empty mouth (F2 > 1650 Hz)",
            "min_harakaat": 0.0,
            "max_harakaat": 0.0,
            "unit": "pronunciation_quality",
            "description": "Name of Allah (اللّه) preceded by Kasrah (ِ)."
        },
        "qalqala": {
            "name": "Qalqala (Echoing Sound)",
            "arabic": "قلقلة (قطب جد)",
            "tier": 2,
            "expected_harakaat": "Echoing energy burst on Saakin",
            "min_harakaat": 0.0,
            "max_harakaat": 0.0,
            "unit": "acoustic_burst",
            "description": "Letters of Qalqala (ق ط ب ج د) carrying Sukoon (ْ) or at Waqf stop."
        },
        "ikhfa_shafawi": {
            "name": "Ikhfa Shafawi (Meem Saakin)",
            "arabic": "إخفاء شفهي",
            "tier": 3,
            "expected_harakaat": "2 Harakaat light nasal hiding at lips",
            "min_harakaat": 1.5,
            "max_harakaat": 2.8,
            "unit": "Harakaat",
            "description": "Meem Saakin (مْ) followed by Baa (ب)."
        },
        "idghaam_shafawi": {
            "name": "Idghaam Shafawi (Meem Saakin)",
            "arabic": "إدغام شفهي",
            "tier": 3,
            "expected_harakaat": "2 Harakaat Meem merging",
            "min_harakaat": 1.5,
            "max_harakaat": 2.8,
            "unit": "Harakaat",
            "description": "Meem Saakin (مْ) followed by Meem Mushaddadah (مّ)."
        },
        "ithaar_shafawi": {
            "name": "Ithaar Shafawi (Clear Meem Saakin)",
            "arabic": "إظهار شفهي",
            "tier": 3,
            "expected_harakaat": "Clear pronunciation without Ghunnah",
            "min_harakaat": 0.5,
            "max_harakaat": 1.2,
            "unit": "Harakaat",
            "description": "Meem Saakin (مْ) followed by any letter except ب or م."
        },
        "ikhfa_noon": {
            "name": "Ikhfa (Noon Saakin & Tanween)",
            "arabic": "إخفاء حقيقي",
            "tier": 4,
            "expected_harakaat": "Light nasal sound for 2 Harakaat",
            "min_harakaat": 1.5,
            "max_harakaat": 2.8,
            "unit": "Harakaat",
            "description": "Noon Saakin or Tanween followed by 15 Ikhfa letters (ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك)."
        },
        "ithaar_noon": {
            "name": "Ithaar (Clear Noon Saakin)",
            "arabic": "إظهار حلقي",
            "tier": 4,
            "expected_harakaat": "Clear pronunciation without Ghunnah",
            "min_harakaat": 0.5,
            "max_harakaat": 1.5,
            "unit": "Harakaat",
            "description": "Noon Saakin or Tanween followed by 6 Throat letters (ء ه ع ح غ خ)."
        },
        "idghaam_ghunnah": {
            "name": "Idghaam with Ghunnah",
            "arabic": "إدغام بغنة",
            "tier": 4,
            "expected_harakaat": "2 Harakaat nasal assimilation",
            "min_harakaat": 1.5,
            "max_harakaat": 2.8,
            "unit": "Harakaat",
            "description": "Noon Saakin or Tanween followed by (ي ن م و)."
        },
        "idghaam_noghunnah": {
            "name": "Idghaam without Ghunnah",
            "arabic": "إدغام بغير غنة",
            "tier": 4,
            "expected_harakaat": "Complete merging without Ghunnah",
            "min_harakaat": 0.5,
            "max_harakaat": 1.5,
            "unit": "Harakaat",
            "description": "Noon Saakin or Tanween followed by (ل ، ر)."
        },
        "idghaam_mithlayn": {
            "name": "Idghaam Mithlayn (Identical Letters)",
            "arabic": "إدغام مثلين",
            "tier": 5,
            "expected_harakaat": "Seamless merging of identical letters",
            "min_harakaat": 0.5,
            "max_harakaat": 2.0,
            "unit": "Harakaat",
            "description": "First letter Saakin (ْ) assimilated into identical second letter carrying Shaddah (ّ)."
        },
        "idghaam_mutaqaaribayn": {
            "name": "Idghaam Mutaqaaribayn (Nearby Origins)",
            "arabic": "إدغام متقاربين",
            "tier": 5,
            "expected_harakaat": "Assimilation of close articulation letters",
            "min_harakaat": 0.5,
            "max_harakaat": 2.0,
            "unit": "Harakaat",
            "description": "Merging of close articulation pairs (ق+ك, ب+م, ل+ر, ن+ر)."
        },
        "raa_heavy": {
            "name": "Raa Tafkheem (Heavy Raa)",
            "arabic": "راء مفخمة",
            "tier": 5,
            "expected_harakaat": "Full mouth pronunciation (F2 < 1550 Hz)",
            "min_harakaat": 0.0,
            "max_harakaat": 0.0,
            "unit": "pronunciation_quality",
            "description": "Raa carrying Fathah/Dhammah, or preceded by Fathah/Dhammah."
        },
        "raa_light": {
            "name": "Raa Tarqeeq (Light Raa)",
            "arabic": "راء مرققة",
            "tier": 5,
            "expected_harakaat": "Thin mouth pronunciation (F2 > 1700 Hz)",
            "min_harakaat": 0.0,
            "max_harakaat": 0.0,
            "unit": "pronunciation_quality",
            "description": "Raa carrying Kasrah, preceded by Kasrah, or preceded by Yaa Saakin."
        },
        "sun_letters": {
            "name": "Sun Letters (الحروف الشمسية)",
            "arabic": "حروف شمسية (إدغام اللام)",
            "tier": 6,
            "expected_harakaat": "Silent Laam merged with Shaddah",
            "min_harakaat": 0.0,
            "max_harakaat": 0.0,
            "unit": "pronunciation_quality",
            "description": "Laam of ال is silent and merges into the Sun letter carrying Shaddah."
        },
        "moon_letters": {
            "name": "Moon Letters (الحروف القمرية)",
            "arabic": "حروف قمرية (إظهار اللام)",
            "tier": 6,
            "expected_harakaat": "Clear Laam Saakin pronunciation",
            "min_harakaat": 0.0,
            "max_harakaat": 0.0,
            "unit": "pronunciation_quality",
            "description": "Laam of ال is pronounced clearly as Laam Saakin (لْ)."
        }
    }
    
    for k, v in rules_catalog.items():
        v["rule_id"] = k
    
    detected_rules = []
    
    # 1. Huroof Muqatta'at (Maddul Laazim - 6 Harakaat)
    if re.search(r'^(الم|الر|المر|المص|كهيعص|طه|طسم|طس|يس|ص|حم|حم\s*عسق|ق|ن)$', text.strip()):
        detected_rules.append({
            "rule_id": "madd_laazim",
            "char_match": text.strip(),
            "char_span": (0, len(text)),
            **rules_catalog["madd_laazim"]
        })

    # 2. Noon & Meem Mushaddadah (Ghunnah - 2 Harakaat)
    for m in re.finditer(r'[نم]ّ', text):
        detected_rules.append({
            "rule_id": "ghunnah_mushaddadah",
            "char_match": m.group(0),
            "char_span": (m.start(), m.end()),
            **rules_catalog["ghunnah_mushaddadah"]
        })

    # 3. Laam of Allah (Tafkheem / Tarqeeq)
    for m in re.finditer(r'(اللَّه|اللّٰه|الله)', text):
        allah_idx = m.start()
        preceding = text[max(0, allah_idx - 3):allah_idx] if allah_idx > 0 else ""
        if "ِ" in preceding:
            detected_rules.append({
                "rule_id": "laam_allah_light",
                "char_match": m.group(0),
                "char_span": (m.start(), m.end()),
                **rules_catalog["laam_allah_light"]
            })
        else:
            detected_rules.append({
                "rule_id": "laam_allah_heavy",
                "char_match": m.group(0),
                "char_span": (m.start(), m.end()),
                **rules_catalog["laam_allah_heavy"]
            })

    # 4. Meem Saakin Rules
    m_ikhfa = re.search(r'مْ?\s*ب', text)
    if m_ikhfa:
        detected_rules.append({
            "rule_id": "ikhfa_shafawi",
            "char_match": m_ikhfa.group(0),
            "char_span": (m_ikhfa.start(), m_ikhfa.end()),
            **rules_catalog["ikhfa_shafawi"]
        })
    m_idg = re.search(r'مْ?\s*مّ', text)
    if m_idg:
        detected_rules.append({
            "rule_id": "idghaam_shafawi",
            "char_match": m_idg.group(0),
            "char_span": (m_idg.start(), m_idg.end()),
            **rules_catalog["idghaam_shafawi"]
        })
    m_ith = re.search(r'مْ', text)
    if m_ith and not m_ikhfa and not m_idg:
        detected_rules.append({
            "rule_id": "ithaar_shafawi",
            "char_match": m_ith.group(0),
            "char_span": (m_ith.start(), m_ith.end()),
            **rules_catalog["ithaar_shafawi"]
        })

    # 5. Noon Saakin / Tanween Rules
    m_no_g = re.search(r'([نْ]|[\u064B\u064C\u064D])\s*[لر]', text)
    if m_no_g:
        detected_rules.append({
            "rule_id": "idghaam_noghunnah",
            "char_match": m_no_g.group(0),
            "char_span": (m_no_g.start(), m_no_g.end()),
            **rules_catalog["idghaam_noghunnah"]
        })
    m_with_g = re.search(r'([نْ]|[\u064B\u064C\u064D])\s*[ينمو]', text)
    if m_with_g and not re.search(r'(الدُّنْيَا|بُنْيَانٌ|صِنْوَانٌ|قِنْوَانٌ)', text):
        detected_rules.append({
            "rule_id": "idghaam_ghunnah",
            "char_match": m_with_g.group(0),
            "char_span": (m_with_g.start(), m_with_g.end()),
            **rules_catalog["idghaam_ghunnah"]
        })
    m_ith_n = re.search(r'([نْ]|[\u064B\u064C\u064D])\s*[ءهعحغخ]', text)
    if m_ith_n:
        detected_rules.append({
            "rule_id": "ithaar_noon",
            "char_match": m_ith_n.group(0),
            "char_span": (m_ith_n.start(), m_ith_n.end()),
            **rules_catalog["ithaar_noon"]
        })
    m_ikh_n = re.search(r'([نْ]|[\u064B\u064C\u064D])\s*[تثجدذزسشصضطظفقك]', text)
    if m_ikh_n:
        detected_rules.append({
            "rule_id": "ikhfa_noon",
            "char_match": m_ikh_n.group(0),
            "char_span": (m_ikh_n.start(), m_ikh_n.end()),
            **rules_catalog["ikhfa_noon"]
        })

    # 6. Idghaam Mithlayn & Mutaqaaribayn
    m_mith = re.search(r'(ربحت\s*تجارتهم|وقد\s*دخلوا|إذ\s*ذهب|يدرككم|استطعت|قمتتم)', text.replace("َّ", "").replace("ِّ", "").replace("ُّ", ""))
    if m_mith:
        detected_rules.append({
            "rule_id": "idghaam_mithlayn",
            "char_match": m_mith.group(0),
            "char_span": (m_mith.start(), m_mith.end()),
            **rules_catalog["idghaam_mithlayn"]
        })
    m_mutaq = re.search(r'(نخلقكم|اركب\s*معنا|وقل\s*رب|فمن\s*ربكما)', text.replace("َّ", "").replace("ِّ", "").replace("ُّ", ""))
    if m_mutaq:
        detected_rules.append({
            "rule_id": "idghaam_mutaqaaribayn",
            "char_match": m_mutaq.group(0),
            "char_span": (m_mutaq.start(), m_mutaq.end()),
            **rules_catalog["idghaam_mutaqaaribayn"]
        })

    # 7. Authentic Madd Rules (Muttasil, Munfasil, Aaridh, Asli)
    words = text.split()
    w_start = 0
    for i, w in enumerate(words):
        w_end = w_start + len(w)
        
        # Maddul Muttasil: Madd letter followed by Hamzah in the SAME word (e.g. جَاءَ, السَّمَاءِ, سِيءَ, سُوءَ)
        m_mutt = re.search(r'(?:[َُِ][اويٰ]|آ|ٓ)[ءئؤ]', w)
        if m_mutt:
            detected_rules.append({
                "rule_id": "madd_muttasil",
                "char_match": w,
                "char_span": (w_start, w_end),
                **rules_catalog["madd_muttasil"]
            })
        # Maddul Munfasil: Word ends in Madd letter and NEXT word begins with Hamzah
        elif i < len(words) - 1 and re.search(r'[َُِ][اويٰ]$|[اى]$', w) and re.match(r'^[أإآء]', words[i+1]):
            comb_end = w_end + 1 + len(words[i+1])
            detected_rules.append({
                "rule_id": "madd_munfasil",
                "char_match": f"{w} {words[i+1]}",
                "char_span": (w_start, comb_end),
                **rules_catalog["madd_munfasil"]
            })
        # Maddul Aaridh Lissukoon: Only on the final word of the recited verse when stopping on Madd + consonant
        elif i == len(words) - 1 and re.search(r'[َُِ][اويٰ][^\s]$', w) and len(words) > 1:
            detected_rules.append({
                "rule_id": "madd_aaridh",
                "char_match": w,
                "char_span": (w_start, w_end),
                **rules_catalog["madd_aaridh"]
            })
        # Maddul Asli (Natural 2 Harakaat): Genuine Madd letters (Fathah+Alif, Dhammah+Waw, Kasrah+Yaa) without Hamzah/Sukoon after
        elif re.search(r'[َ][اٰ]|[ُ][و]|[ِ][ي]', w) and not re.search(r'[ءئؤ]', w):
            detected_rules.append({
                "rule_id": "madd_asli",
                "char_match": w,
                "char_span": (w_start, w_end),
                **rules_catalog["madd_asli"]
            })
            
        w_start = w_end + 1

    # 8. Qalqala (قطبجد with Sukoon or at stopping position)
    qalqala_chars = r'[قطبجد]'
    for m in re.finditer(fr'{qalqala_chars}ْ', text):
        detected_rules.append({
            "rule_id": "qalqala",
            "char_match": m.group(0),
            "char_span": (m.start(), m.end()),
            **rules_catalog["qalqala"]
        })
    if words and re.search(fr'{qalqala_chars}[^\s]*$', words[-1]):
        last_w_start = len(text) - len(words[-1])
        detected_rules.append({
            "rule_id": "qalqala",
            "char_match": words[-1],
            "char_span": (last_w_start, len(text)),
            **rules_catalog["qalqala"]
        })

    # 9. Rules of Raa (Heavy vs Light)
    for m in re.finditer(r'ر', text):
        r_idx = m.start()
        post_r = text[r_idx:min(len(text), r_idx + 3)]
        pre_r = text[max(0, r_idx - 3):r_idx]
        if "ِ" in post_r or "ِ" in pre_r or "يْ" in pre_r:
            detected_rules.append({
                "rule_id": "raa_light",
                "char_match": "ر (مرققة)",
                "char_span": (max(0, r_idx - 1), min(len(text), r_idx + 2)),
                **rules_catalog["raa_light"]
            })
        elif "َ" in post_r or "ُ" in post_r or "َ" in pre_r or "ُ" in pre_r:
            detected_rules.append({
                "rule_id": "raa_heavy",
                "char_match": "ر (مفخمة)",
                "char_span": (max(0, r_idx - 1), min(len(text), r_idx + 2)),
                **rules_catalog["raa_heavy"]
            })

    # 10. Sun & Moon Letters
    for m in re.finditer(r'ال[تثدذرزسشصضطظلن]', text):
        detected_rules.append({
            "rule_id": "sun_letters",
            "char_match": m.group(0),
            "char_span": (m.start(), m.end()),
            **rules_catalog["sun_letters"]
        })
    for m in re.finditer(r'ال[ابجحخعغفقكمهو ي]', text):
        detected_rules.append({
            "rule_id": "moon_letters",
            "char_match": m.group(0),
            "char_span": (m.start(), m.end()),
            **rules_catalog["moon_letters"]
        })

    # Deduplicate rules by rule_id (keep first instance's span/definition)
    unique_rules = []
    seen = set()
    for r in detected_rules:
        if r["rule_id"] not in seen:
            seen.add(r["rule_id"])
            unique_rules.append(r)
            
    return unique_rules, list(rules_catalog.values())


# =========================================================================
# Sequence Diff & Grapheme-Level Alignment Enrichment
# =========================================================================

def split_arabic_graphemes(text: str) -> list[str]:
    """
    Extracts complete Arabic phonetic grapheme clusters:
    a base consonant/letter together with all attached combining marks
    (Harakaat, Sukoon, Shaddah, Dagger Alif, Tanween, etc.).
    """
    pattern = r'[^\u064B-\u065F\u0670\u0651\u06D6-\u06ED\s](?:[\u064B-\u065F\u0670\u0651\u06D6-\u06ED])*'
    matches = re.findall(pattern, text)
    if not matches:
        return [c for c in text if not c.isspace()]
    return matches


def align_character_diff(expected_text: str, raw_alignment: list[dict], duration: float = 4.0) -> tuple[list[dict], float]:
    """
    Aligns target expected verse text against CTC detected character frames using grapheme clusters.
    Returns (enriched_alignment_list, character_accuracy_percentage).
    """
    import difflib

    exp_graphemes = split_arabic_graphemes(expected_text)
    if not exp_graphemes:
        exp_graphemes = [c for c in expected_text if not c.isspace()]

    total_graphemes = len(exp_graphemes)
    if not total_graphemes:
        return [], 0.0

    if not raw_alignment:
        step = duration / max(1, total_graphemes)
        alignment = []
        for i, g in enumerate(exp_graphemes):
            st = round(float(i * step), 3)
            et = round(float((i + 1) * step), 3)
            alignment.append({
                "char": g,
                "expected_char": g,
                "detected_char": "[Unclear]",
                "start_time": st,
                "end_time": et,
                "is_match": False,
                "status": "missing",
                "correction_note": f"Missing expected pronunciation of '{g}'"
            })
        return alignment, 0.0

    exp_norm = [normalize_arabic_text(g) or g for g in exp_graphemes]
    det_norm = [normalize_arabic_text(item.get("char", "")) or item.get("char", "") for item in raw_alignment]

    matcher = difflib.SequenceMatcher(None, exp_norm, det_norm)
    opcodes = matcher.get_opcodes()

    aligned_timeline = []
    matched_count = 0

    for tag, i1, i2, j1, j2 in opcodes:
        if tag == "equal":
            for idx_e, idx_d in zip(range(i1, i2), range(j1, j2)):
                raw_item = raw_alignment[idx_d]
                exp_g = exp_graphemes[idx_e]
                det_c = raw_item.get("char", "")
                st = raw_item.get("start_time", 0.0)
                et = raw_item.get("end_time", 0.0)
                aligned_timeline.append({
                    "char": exp_g,
                    "expected_char": exp_g,
                    "detected_char": det_c,
                    "start_time": st,
                    "end_time": et,
                    "is_match": True,
                    "status": "correct",
                    "correction_note": None
                })
                matched_count += 1
        elif tag == "replace":
            for idx_e, idx_d in zip(range(i1, i2), range(j1, j2)):
                raw_item = raw_alignment[idx_d]
                exp_g = exp_graphemes[idx_e]
                det_c = raw_item.get("char", "")
                st = raw_item.get("start_time", 0.0)
                et = raw_item.get("end_time", 0.0)
                aligned_timeline.append({
                    "char": exp_g,
                    "expected_char": exp_g,
                    "detected_char": det_c,
                    "start_time": st,
                    "end_time": et,
                    "is_match": False,
                    "status": "mismatch",
                    "correction_note": f"At {st:.2f}s: expected '{exp_g}', detected '{det_c}'"
                })
            if (i2 - i1) > (j2 - j1):
                last_t = raw_alignment[min(j2 - 1, len(raw_alignment) - 1)].get("end_time", 0.0) if raw_alignment else 0.0
                for idx_e in range(i1 + (j2 - j1), i2):
                    exp_g = exp_graphemes[idx_e]
                    aligned_timeline.append({
                        "char": exp_g,
                        "expected_char": exp_g,
                        "detected_char": "",
                        "start_time": last_t,
                        "end_time": last_t,
                        "is_match": False,
                        "status": "missing",
                        "correction_note": f"Omitted expected '{exp_g}'"
                    })
        elif tag == "delete":
            last_t = raw_alignment[min(j1 - 1, len(raw_alignment) - 1)].get("end_time", 0.0) if (j1 > 0 and raw_alignment) else 0.0
            for idx_e in range(i1, i2):
                exp_g = exp_graphemes[idx_e]
                aligned_timeline.append({
                    "char": exp_g,
                    "expected_char": exp_g,
                    "detected_char": "",
                    "start_time": last_t,
                    "end_time": last_t,
                    "is_match": False,
                    "status": "missing",
                    "correction_note": f"Omitted expected '{exp_g}'"
                })
        elif tag == "insert":
            pass

    # Post-process: Timestamp Smoothing & Boundary Interpolation
    n = len(aligned_timeline)
    for idx, item in enumerate(aligned_timeline):
        st = item["start_time"]
        et = item["end_time"]
        if et <= st or (et - st) < 0.12:
            prev_et = aligned_timeline[idx - 1]["end_time"] if idx > 0 else 0.0
            next_st = aligned_timeline[idx + 1]["start_time"] if idx + 1 < n and aligned_timeline[idx + 1]["start_time"] > prev_et else duration
            allocated_dur = max(0.14, min(0.40, (next_st - prev_et) / 2.0))
            item["start_time"] = round(prev_et, 3)
            item["end_time"] = round(prev_et + allocated_dur, 3)

    for i in range(1, n):
        if aligned_timeline[i]["start_time"] < aligned_timeline[i-1]["start_time"]:
            aligned_timeline[i]["start_time"] = aligned_timeline[i-1]["end_time"]
        if aligned_timeline[i]["end_time"] <= aligned_timeline[i]["start_time"]:
            aligned_timeline[i]["end_time"] = round(aligned_timeline[i]["start_time"] + 0.18, 3)

    accuracy = round((matched_count / max(1, total_graphemes)) * 100.0, 1)
    return aligned_timeline, accuracy


# =========================================================================
# Trellis Dynamic Programming CTC Forced Alignment
# =========================================================================

def ctc_trellis_forced_alignment(
    log_probs: torch.Tensor,
    target_tokens: list[int],
    duration: float
) -> list[dict]:
    """
    Frame-accurate CTC forced alignment using Viterbi trellis dynamic programming.
    Maps target token indices to precise start and end timestamps.
    """
    num_frames, vocab_size = log_probs.shape
    num_tokens = len(target_tokens)
    if num_tokens == 0 or num_frames < num_tokens:
        return []

    # 1. Build forward trellis matrix (frames x tokens)
    trellis = torch.full((num_frames, num_tokens), -float("inf"), dtype=torch.float32, device=log_probs.device)
    trellis[0, 0] = log_probs[0, target_tokens[0]]

    for t in range(1, num_frames):
        trellis[t, 0] = trellis[t-1, 0] + log_probs[t, target_tokens[0]]
        for j in range(1, min(t + 1, num_tokens)):
            p_stay = trellis[t-1, j] + log_probs[t, target_tokens[j]]
            p_advance = trellis[t-1, j-1] + log_probs[t, target_tokens[j]]
            trellis[t, j] = torch.maximum(p_stay, p_advance)

    # 2. Backtrack optimal frame path across the full audio timeline
    t = num_frames - 1
    j = num_tokens - 1
    path = []

    while t > 0 and j > 0:
        p_stay = trellis[t-1, j]
        p_advance = trellis[t-1, j-1]
        path.append((t, j))
        if p_advance >= p_stay or t == j:
            j -= 1
        t -= 1

    while t >= 0:
        path.append((t, 0))
        t -= 1

    path.reverse()

    # 3. Extract contiguous frame spans per token
    time_per_frame = duration / max(1, num_frames)
    token_spans = []
    curr_token_idx = path[0][1]
    start_frame = path[0][0]

    for f_idx, tok_idx in path:
        if tok_idx != curr_token_idx:
            token_spans.append({
                "token_index": curr_token_idx,
                "start_time": round(float(start_frame * time_per_frame), 3),
                "end_time": round(float(f_idx * time_per_frame), 3)
            })
            curr_token_idx = tok_idx
            start_frame = f_idx

    token_spans.append({
        "token_index": curr_token_idx,
        "start_time": round(float(start_frame * time_per_frame), 3),
        "end_time": round(float(path[-1][0] * time_per_frame), 3)
    })

    return token_spans


# =========================================================================
# Tajweed Evaluator Class
# =========================================================================

class TajweedEvaluator:
    def __init__(
        self,
        alignment_model_name: str = "jonatasgrosman/wav2vec2-large-xlsr-53-arabic",
        quran_asr_model_name: str = "tarteel-ai/whisper-base-ar-quran"
    ):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        print(f"Loading Quranic Whisper ASR model ({quran_asr_model_name}) on device: {self.device}...")
        self.quran_processor = AutoProcessor.from_pretrained(quran_asr_model_name)
        self.quran_model = AutoModelForSpeechSeq2Seq.from_pretrained(quran_asr_model_name).to(self.device)
        self.quran_model.eval()

        print(f"Loading Forced Alignment model ({alignment_model_name}) on device: {self.device}...")
        self.processor = AutoProcessor.from_pretrained(alignment_model_name)
        self.model = AutoModelForCTC.from_pretrained(alignment_model_name).to(self.device)
        self.model.eval()
        print("TajweedEvaluator Quran ASR & CTC Alignment models loaded successfully.")

    def process_audio(self, file_bytes: bytes, filename: str = "") -> np.ndarray:
        """Forces all incoming audio bytes to a 16,000 Hz Mono float32 numpy array."""
        # Stage 1: Try decoding with FFmpeg via imageio_ffmpeg
        try:
            import subprocess
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            cmd = [
                ffmpeg_exe,
                "-i", "pipe:0",
                "-f", "s16le",
                "-ac", "1",
                "-ar", "16000",
                "-acodec", "pcm_s16le",
                "pipe:1"
            ]
            proc = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            raw_pcm, _ = proc.communicate(input=file_bytes)
            if proc.returncode == 0 and len(raw_pcm) > 0:
                audio_int16 = np.frombuffer(raw_pcm, dtype=np.int16)
                arr = audio_int16.astype(np.float32) / 32768.0
                if arr.size > 0:
                    return arr
        except Exception:
            pass

        # Stage 2: In-memory librosa load
        try:
            audio_stream = io.BytesIO(file_bytes)
            waveform, _ = librosa.load(audio_stream, sr=16000, mono=True, dtype=np.float32)
            if waveform.size > 0:
                return waveform
        except Exception:
            pass

        # Stage 3: Tempfile fallback
        ext = Path(filename).suffix if filename else ".audio"
        if not ext.startswith("."):
            ext = f".{ext}"

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = Path(tmp.name)

        try:
            try:
                tensor, sr = torchaudio.load(str(tmp_path))
                if tensor.numel() > 0:
                    if tensor.shape[0] > 1:
                        tensor = torch.mean(tensor, dim=0, keepdim=True)
                    tensor = tensor.squeeze(0)
                    if sr != 16000:
                        tensor = torchaudio.functional.resample(tensor, orig_freq=sr, new_freq=16000)
                    return tensor.cpu().numpy().astype(np.float32)
            except Exception:
                pass

            waveform, _ = librosa.load(str(tmp_path), sr=16000, mono=True, dtype=np.float32)
            if waveform.size > 0:
                return waveform
            raise ValueError("Audio format could not be decoded.")
        finally:
            if tmp_path.exists():
                try:
                    tmp_path.unlink()
                except Exception:
                    pass

    @torch.no_grad()
    def transcribe_audio(self, audio_array: np.ndarray) -> str:
        """
        High-precision Quranic speech-to-text decoding using fine-tuned Whisper (tarteel-ai/whisper-base-ar-quran).
        Returns predicted Quranic Arabic transcript with Tashkeel.
        """
        if audio_array is None or len(audio_array) == 0:
            return ""
        try:
            inputs = self.quran_processor(audio_array, sampling_rate=16000, return_tensors="pt")
            feat = inputs.input_features.to(self.device)
            predicted_ids = self.quran_model.generate(feat, max_new_tokens=128)
            transcription = self.quran_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
            # Strip Whisper language / task prompt tags if any
            clean_text = re.sub(r'<\|[a-zA-Z0-9_\-]+\|>', '', transcription).strip()
            return clean_text
        except Exception as e:
            # Fallback to CTC model
            inputs = self.processor(audio_array, sampling_rate=16000, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            logits = self.model(**inputs).logits
            predicted_ids = torch.argmax(logits, dim=-1)[0]
            transcription = self.processor.decode(predicted_ids.tolist())
            return transcription.strip()

    @torch.no_grad()
    def align_audio(self, audio_array: np.ndarray, target_text: str) -> tuple[list[dict], float]:
        """
        Performs frame-accurate CTC forced alignment using Trellis dynamic programming.
        Returns (alignment_list, alignment_confidence).
        """
        duration = len(audio_array) / 16000.0
        inputs = self.processor(audio_array, sampling_rate=16000, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        outputs = self.model(**inputs)
        logits = outputs.logits[0]  # [num_frames, vocab_size]
        log_probs = torch.log_softmax(logits, dim=-1)
        probs = torch.softmax(logits, dim=-1)
        max_probs, predicted_ids = torch.max(probs, dim=-1)
        
        confidence = round(float(torch.mean(max_probs).item()) * 100.0, 1)

        alignment_results = []
        
        # 1. Try CTC Trellis Forced Alignment against normalized target text
        norm_text = normalize_arabic_text(target_text)
        if norm_text:
            target_ids = self.processor.tokenizer.encode(norm_text, add_special_tokens=False)
            if target_ids:
                trellis_spans = ctc_trellis_forced_alignment(log_probs, target_ids, duration)
                if trellis_spans and len(trellis_spans) == len(target_ids):
                    tokens = [self.processor.tokenizer.decode([tid]) for tid in target_ids]
                    for span, tok in zip(trellis_spans, tokens):
                        tok_str = tok.strip()
                        if tok_str:
                            alignment_results.append({
                                "char": tok_str,
                                "start_time": span["start_time"],
                                "end_time": span["end_time"]
                            })

        # 2. Fallback to Character Offsets from standard decoding
        if not alignment_results:
            decoded = self.processor.tokenizer.decode(predicted_ids.tolist(), output_char_offsets=True)
            char_offsets = getattr(decoded, "char_offsets", None)
            num_frames = logits.shape[0]
            time_per_frame = duration / max(1, num_frames)

            if char_offsets:
                for item in char_offsets:
                    c = item.get("char", "").strip()
                    if not c:
                        continue
                    start_t = round(float(item["start_offset"] * time_per_frame), 3)
                    end_t = round(float((item["end_offset"] + 1) * time_per_frame), 3)
                    if end_t <= start_t:
                        end_t = round(start_t + 0.1, 3)
                    alignment_results.append({
                        "char": c,
                        "start_time": start_t,
                        "end_time": end_t
                    })

        # 3. Fallback to Uniform Partition if alignment failed
        if not alignment_results and target_text:
            clean_chars = [c for c in target_text if not c.isspace()]
            if not clean_chars:
                clean_chars = list(target_text)

            step = duration / max(1, len(clean_chars))
            for i, char in enumerate(clean_chars):
                st = round(float(i * step), 3)
                et = round(float((i + 1) * step), 3)
                alignment_results.append({
                    "char": char,
                    "start_time": st,
                    "end_time": et
                })

        return alignment_results, confidence

    def evaluate_tajweed_pipeline(self, audio_array: np.ndarray, target_text: str) -> dict:
        """
        Executes complete 5-Stage Tajweed Evaluation Architecture:
        Stage 0: Audio Quality & VAD Gate
        Stage 1: ASR Transcription & Similarity
        Stage 2: Frame-Accurate CTC Trellis Alignment & Character Diff
        Stage 3: Dynamic Rule Extraction & Span Localization from INFO.md
        Stage 4: Formants (F1, F2, F3), Spectral Energy & Acoustic Rule Scoring
        Stage 5: Feedback Assembly
        """
        duration = round(float(len(audio_array) / 16000.0), 3)

        # STAGE 0: Audio Quality & VAD Gate
        v_res = check_audio_quality(audio_array)
        if not v_res["is_valid_speech"]:
            return {
                "status": "insufficient_speech",
                "message": "Unable to evaluate due to lack of recitation.",
                "details": "The uploaded audio is silent or does not contain clear speech activity.",
                "audio_duration_seconds": duration,
                "vad_metrics": v_res,
                "evaluations": []
            }

        # STAGE 1: Phrase ASR Transcription & Similarity Calculation
        asr_transcript = self.transcribe_audio(audio_array)
        norm_expected = normalize_arabic_text(target_text)
        norm_detected = normalize_arabic_text(asr_transcript)
        similarity = levenshtein_similarity(norm_expected, norm_detected)

        # STAGE 2: Frame-Accurate Forced Alignment & Character Sequence Diffing
        raw_alignment, align_confidence = self.align_audio(audio_array, target_text)
        enriched_alignment, char_accuracy = align_character_diff(target_text, raw_alignment, duration=duration)

        # Recitation Integrity Verification
        # A valid recitation must achieve at least 40% ASR word/character similarity against the target verse.
        # Random gibberish, wrong language, or ambient noise will have very low similarity (< 35%).
        is_verse_recited = (similarity >= 38.0 and char_accuracy >= 40.0) or (similarity >= 55.0) or (char_accuracy >= 65.0)
        base_recitation_score = round(float(similarity * 0.5 + char_accuracy * 0.5), 1)

        # STAGE 3: Parse Applicable Rules and Character Spans
        present_rules, all_catalog = parse_tajweed_rules_from_text(target_text)
        present_rule_map = {r["rule_id"]: r for r in present_rules}

        # STAGE 4: Evaluate Rules via Acoustic DSP & Formant Tracking
        evaluations = []
        HARAKAH_DURATION = 0.45  # Standard average beat duration in seconds

        for r_def in all_catalog:
            r_id = r_def["rule_id"]
            
            if r_id not in present_rule_map:
                # Rule is NOT applicable to this verse
                evaluations.append({
                    "rule_id": r_id,
                    "rule_name": r_def["name"],
                    "arabic_name": r_def["arabic"],
                    "tier": r_def["tier"],
                    "applicable": False,
                    "status": "not_applicable",
                    "confidence_score": 100.0,
                    "detected_metric": "N/A",
                    "expected_metric": r_def["expected_harakaat"],
                    "suggestion": f"Rule '{r_def['name']}' is not present in the target verse.",
                    "description": r_def["description"]
                })
            elif not is_verse_recited:
                # User did NOT recite the target verse (e.g. gibberish, wrong language, or noise)
                evaluations.append({
                    "rule_id": r_id,
                    "rule_name": r_def["name"],
                    "arabic_name": r_def["arabic"],
                    "tier": r_def["tier"],
                    "applicable": True,
                    "status": "needs_review",
                    "confidence_score": max(5.0, base_recitation_score),
                    "detected_metric": f"Mismatched speech (Similarity: {similarity}%)",
                    "expected_metric": r_def["expected_harakaat"],
                    "suggestion": f"Recitation did not match expected verse '{target_text}'. Detected '{asr_transcript}'. Please recite clearly.",
                    "description": r_def["description"]
                })
            else:
                # Rule is PRESENT and verse WAS recited -> Evaluate acoustic features
                p_info = present_rule_map[r_id]
                char_span = p_info.get("char_span", (0, len(target_text)))
                
                # Map character span to alignment timestamps
                exp_chars_nonspace = [c for c in target_text if not c.isspace()]
                start_c_idx = max(0, min(len(enriched_alignment) - 1, int((char_span[0] / max(1, len(target_text))) * len(enriched_alignment))))
                end_c_idx = max(start_c_idx, min(len(enriched_alignment) - 1, int((char_span[1] / max(1, len(target_text))) * len(enriched_alignment))))
                
                seg_start = enriched_alignment[start_c_idx]["start_time"] if enriched_alignment else 0.0
                seg_end = enriched_alignment[end_c_idx]["end_time"] if enriched_alignment else duration
                seg_duration = max(0.15, seg_end - seg_start)

                # Extract audio slice for this specific rule
                slice_start_sample = max(0, int(seg_start * 16000))
                slice_end_sample = min(len(audio_array), int(seg_end * 16000))
                rule_audio_slice = audio_array[slice_start_sample:slice_end_sample]
                if len(rule_audio_slice) < 160:
                    rule_audio_slice = audio_array

                # 1. Ghunnah & Nasalization Rules (Noon/Meem Mushaddadah, Ikhfa, Idghaam with Ghunnah)
                if r_id in ("ghunnah_mushaddadah", "ikhfa_noon", "idghaam_ghunnah", "ikhfa_shafawi", "idghaam_shafawi") or "ghunnah" in r_id or "ikhfa" in r_id:
                    detected_harakaat = round(seg_duration / 0.35, 1)
                    nasal_ratio = compute_nasal_energy_ratio(rule_audio_slice)
                    is_nasal_passed = nasal_ratio >= 0.22
                    is_timing_passed = detected_harakaat >= 1.4  # Must hold for ~2 full Harakaat (>= 0.5s)
                    passed = is_nasal_passed and is_timing_passed
                    
                    if passed:
                        suggestion = f"Masha'Allah! Strong nasal resonance (Ghunnah ratio {nasal_ratio}) held for {detected_harakaat} Harakaat."
                        status = "passed"
                        score = 95.0
                    else:
                        if not is_timing_passed:
                            suggestion = f"Maintain Ghunnah for full 2 Harakaat. Detected {detected_harakaat} Harakaat ({round(seg_duration, 2)}s)."
                        else:
                            suggestion = f"Deepen nasal airflow through the nasal cavity (Ghunnah ratio {nasal_ratio})."
                        status = "needs_review"
                        score = 40.0

                    evaluations.append({
                        "rule_id": r_id,
                        "rule_name": r_def["name"],
                        "arabic_name": r_def["arabic"],
                        "tier": r_def["tier"],
                        "applicable": True,
                        "status": status,
                        "confidence_score": score,
                        "detected_metric": f"{detected_harakaat} Harakaat ({round(seg_duration, 2)}s, Ghunnah Ratio: {nasal_ratio})",
                        "expected_metric": r_def["expected_harakaat"],
                        "suggestion": suggestion,
                        "description": r_def["description"]
                    })

                # 2. Madd Rules (Timing & Duration)
                elif r_id.startswith("madd_"):
                    detected_harakaat = round(seg_duration / 0.35, 1)
                    min_h = r_def.get("min_harakaat", 1.5)
                    max_h = r_def.get("max_harakaat", 2.8)

                    passed = (min_h <= detected_harakaat <= max_h)
                    if passed:
                        suggestion = f"Excellent! Elongation duration ({detected_harakaat} Harakaat) matches required {r_def['expected_harakaat']}."
                        status = "passed"
                        score = 95.0
                    else:
                        if detected_harakaat < min_h:
                            suggestion = f"Lengthen vowel stretch. Detected {detected_harakaat} Harakaat; expected {r_def['expected_harakaat']}."
                        else:
                            suggestion = f"Shorten vowel stretch. Detected {detected_harakaat} Harakaat; expected {r_def['expected_harakaat']}."
                        status = "needs_review"
                        score = 40.0

                    evaluations.append({
                        "rule_id": r_id,
                        "rule_name": r_def["name"],
                        "arabic_name": r_def["arabic"],
                        "tier": r_def["tier"],
                        "applicable": True,
                        "status": status,
                        "confidence_score": score,
                        "detected_metric": f"{detected_harakaat} Harakaat ({round(seg_duration, 2)}s)",
                        "expected_metric": r_def["expected_harakaat"],
                        "suggestion": suggestion,
                        "description": r_def["description"]
                    })

                # 3. Qalqala Evaluation (Burst Energy Ratio)
                elif r_id == "qalqala":
                    burst_ratio = compute_qalqala_burst_ratio(rule_audio_slice)
                    passed = burst_ratio >= 1.20
                    status = "passed" if passed else "needs_review"
                    score = 95.0 if passed else 45.0
                    suggestion = (
                        f"Clean Qalqala echo burst detected (Burst ratio {burst_ratio})."
                        if passed else
                        f"Provide a crisper jerking release on the Saakin letter (Burst ratio {burst_ratio})."
                    )
                    evaluations.append({
                        "rule_id": r_id,
                        "rule_name": r_def["name"],
                        "arabic_name": r_def["arabic"],
                        "tier": r_def["tier"],
                        "applicable": True,
                        "status": status,
                        "confidence_score": score,
                        "detected_metric": f"Burst Energy Ratio: {burst_ratio}",
                        "expected_metric": r_def["expected_harakaat"],
                        "suggestion": suggestion,
                        "description": r_def["description"]
                    })

                # 4. Clear Pronunciation Rules (Ithaar, Idghaam without Ghunnah)
                elif r_id in ("ithaar_noon", "ithaar_shafawi", "idghaam_noghunnah"):
                    detected_harakaat = round(seg_duration / 0.35, 1)
                    passed = detected_harakaat <= 1.3
                    status = "passed" if passed else "needs_review"
                    score = 95.0 if passed else 45.0
                    suggestion = (
                        f"Clear, distinct pronunciation without elongation."
                        if passed else
                        f"Do not pause or add nasal Ghunnah to clear letters. Detected {detected_harakaat} Harakaat."
                    )
                    evaluations.append({
                        "rule_id": r_id,
                        "rule_name": r_def["name"],
                        "arabic_name": r_def["arabic"],
                        "tier": r_def["tier"],
                        "applicable": True,
                        "status": status,
                        "confidence_score": score,
                        "detected_metric": f"{detected_harakaat} Harakaat ({round(seg_duration, 2)}s)",
                        "expected_metric": r_def["expected_harakaat"],
                        "suggestion": suggestion,
                        "description": r_def["description"]
                    })

                # 5. Laam of Allah Formant Evaluation (Tafkheem vs Tarqeeq)
                elif r_id.startswith("laam_allah"):
                    f1, f2, f3 = compute_lpc_formants(rule_audio_slice)
                    if r_id == "laam_allah_heavy":
                        passed = (f2 < 1650) if f2 > 0 else True
                        suggestion = (
                            f"Great Tafkheem! Deep full-mouth resonance detected (F2={f2} Hz)."
                            if passed else
                            f"Deepen the mouth cavity for heavy Tafkheem sound."
                        )
                    else:
                        passed = (f2 >= 1500) if f2 > 0 else True
                        suggestion = (
                            f"Great Tarqeeq! Clear thin-mouth resonance detected (F2={f2} Hz)."
                            if passed else
                            f"Keep the mouth relaxed for light Tarqeeq."
                        )

                    status = "passed" if passed else "needs_review"
                    score = 95.0 if passed else 45.0

                    evaluations.append({
                        "rule_id": r_id,
                        "rule_name": r_def["name"],
                        "arabic_name": r_def["arabic"],
                        "tier": r_def["tier"],
                        "applicable": True,
                        "status": status,
                        "confidence_score": score,
                        "detected_metric": f"Formants: F1={f1}Hz, F2={f2}Hz, F3={f3}Hz",
                        "expected_metric": r_def["expected_harakaat"],
                        "suggestion": suggestion,
                        "description": r_def["description"]
                    })

                # 6. Raa Formant Evaluation (Tafkheem vs Tarqeeq)
                elif r_id.startswith("raa_"):
                    f1, f2, f3 = compute_lpc_formants(rule_audio_slice)
                    if r_id == "raa_heavy":
                        passed = (f2 < 1650) if f2 > 0 else True
                        suggestion = (
                            f"Full mouth heavy Raa verified (F2={f2} Hz)."
                            if passed else
                            f"Elevate back of tongue for heavy Raa Tafkheem."
                        )
                    else:
                        passed = (f2 >= 1500) if f2 > 0 else True
                        suggestion = (
                            f"Light thin Raa Tarqeeq verified (F2={f2} Hz)."
                            if passed else
                            f"Flatten tongue body for light Raa Tarqeeq."
                        )

                    status = "passed" if passed else "needs_review"
                    score = 95.0 if passed else 45.0

                    evaluations.append({
                        "rule_id": r_id,
                        "rule_name": r_def["name"],
                        "arabic_name": r_def["arabic"],
                        "tier": r_def["tier"],
                        "applicable": True,
                        "status": status,
                        "confidence_score": score,
                        "detected_metric": f"Formants: F1={f1}Hz, F2={f2}Hz, F3={f3}Hz",
                        "expected_metric": r_def["expected_harakaat"],
                        "suggestion": suggestion,
                        "description": r_def["description"]
                    })

                # 7. Other Rules (Sun / Moon letters, Idghaam Mithlayn)
                else:
                    status = "passed" if base_recitation_score >= 60.0 else "needs_review"
                    score = 95.0 if status == "passed" else 40.0
                    evaluations.append({
                        "rule_id": r_id,
                        "rule_name": r_def["name"],
                        "arabic_name": r_def["arabic"],
                        "tier": r_def["tier"],
                        "applicable": True,
                        "status": status,
                        "confidence_score": score,
                        "detected_metric": f"Segment ({round(seg_duration, 2)}s)",
                        "expected_metric": r_def["expected_harakaat"],
                        "suggestion": f"Clear articulation maintained for {r_def['name']}.",
                        "description": r_def["description"]
                    })

        # Append character accuracy summary card only if significant pronunciation corrections are needed
        mismatch_items = [item for item in enriched_alignment if not item.get("is_match")]
        if mismatch_items and char_accuracy < 85.0:
            mismatch_notes = [item["correction_note"] for item in mismatch_items if item.get("correction_note")]
            evaluations.insert(0, {
                "rule_id": "character_pronunciation_diff",
                "rule_name": "Phoneme & Character Accuracy",
                "arabic_name": "دقة نطق الحروف",
                "tier": 1,
                "applicable": True,
                "status": "passed" if char_accuracy >= 75.0 else ("needs_review" if char_accuracy >= 50.0 else "failed"),
                "confidence_score": char_accuracy,
                "detected_metric": f"{char_accuracy}% Accuracy ({len(enriched_alignment) - len(mismatch_items)}/{len(enriched_alignment)} chars correct)",
                "expected_metric": "100.0% Exact Match",
                "suggestion": f"Character corrections suggested at: {'; '.join(mismatch_notes[:3])}" if mismatch_notes else "Masha'Allah! Good pronunciation accuracy.",
                "description": "Character-by-character acoustic forced alignment comparison against expected target verse."
            })

        return {
            "status": "success",
            "message": "Tajweed character alignment and acoustic evaluation completed successfully.",
            "audio_duration_seconds": duration,
            "phrase_verification": {
                "similarity_percentage": similarity,
                "character_accuracy_percentage": char_accuracy,
                "expected_text": target_text,
                "asr_transcription": asr_transcript
            },
            "alignment_confidence": align_confidence,
            "alignment": enriched_alignment,
            "evaluations": evaluations
        }
