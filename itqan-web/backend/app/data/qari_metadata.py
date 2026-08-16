"""
Qari Metadata Provider & Directory
Extracts all 242 Qaris from the vector database and overlays biographical details for top authentic reciters.
"""

import json
from pathlib import Path
from typing import Dict, Any, List
from app.core.config import VECTOR_DB_PATH

FAMOUS_QARI_BIOS: Dict[str, Dict[str, str]] = {
    "Mahmoud Khalil Al-Husary": {
        "arabic_name": "محمود خليل الحصري",
        "country": "Egypt",
        "style": "Murattal (Strict Classical Tajweed)",
        "riwayah": "Hafs 'an 'Asim",
        "biography": "One of the most esteemed Quran reciters of all time, celebrated for his precision in Tajweed timing, impeccable Makharij articulation, and golden-standard educational recordings."
    },
    "Mishary Rashid Alafasy": {
        "arabic_name": "مشاري بن راشد العفاسي",
        "country": "Kuwait",
        "style": "Murattal (Melodic Tarteel)",
        "riwayah": "Hafs 'an 'Asim",
        "biography": "Imam of the Grand Mosque of Kuwait, renowned globally for his melodious, resonant voice, emotional delivery, and clear vowel enunciations."
    },
    "Abdul Basit Abdul Samad": {
        "arabic_name": "عبد الباسط عبد الصمد",
        "country": "Egypt",
        "style": "Mujawwad & Murattal (Golden Breath Mastery)",
        "riwayah": "Hafs 'an 'Asim",
        "biography": "The 'Golden Throat' of Egypt, world-famous for his extraordinary lung capacity, soaring high registers, and majestic Mujawwad recitations."
    },
    "Mohamed Siddiq Al-Minshawi": {
        "arabic_name": "محمد صديق المنشاوي",
        "country": "Egypt",
        "style": "Murattal & Mujawwad (The Weeping Voice)",
        "riwayah": "Hafs 'an 'Asim",
        "biography": "Affectionately known as 'The Weeping Voice' (الصوت الباكي), distinguished by profound spirituality, emotive phrasing, and crystal-clear acoustic transitions."
    },
    "Ali Jaber": {
        "arabic_name": "علي جابر",
        "country": "Saudi Arabia",
        "style": "Haramayn Murattal",
        "riwayah": "Hafs 'an 'Asim",
        "biography": "Former Imam of the Grand Mosque in Makkah (Masjid al-Haram), beloved for his swift, deeply resonant, and rhythmically captivating Taraweeh recitations."
    },
    "Saad Al-Ghamdi": {
        "arabic_name": "سعد الغامدي",
        "country": "Saudi Arabia",
        "style": "Murattal (Warm Modern)",
        "riwayah": "Hafs 'an 'Asim",
        "biography": "Prominent Saudi reciter and Islamic scholar with a smooth, warm vocal timbre that is accessible and comforting for daily memorization."
    },
    "Yasser Al-Dosari": {
        "arabic_name": "ياسر الدوسري",
        "country": "Saudi Arabia",
        "style": "Haramayn High-Resonance",
        "riwayah": "Hafs 'an 'Asim",
        "biography": "Imam of Masjid al-Haram in Makkah, known for dynamic vocal intensity, powerful Makhaarij bursts, and uplifting melodic inflections."
    },
    "Abu Bakr Al-Shatri": {
        "arabic_name": "أبو بكر الشاطري",
        "country": "Saudi Arabia",
        "style": "Gentle Rhythmic Murattal",
        "riwayah": "Hafs 'an 'Asim",
        "biography": "Distinguished Saudi Imam with a gentle, soothing tone and deliberate pacing ideal for beginner-to-intermediate Tajweed students."
    },
    "Maher Al-Muaiqly": {
        "arabic_name": "ماهر المعيقلي",
        "country": "Saudi Arabia",
        "style": "Haramayn Murattal",
        "riwayah": "Hafs 'an 'Asim",
        "biography": "Celebrated Imam of the Grand Mosque in Makkah, acclaimed for his warm, resonant voice, steady cadence, and emotional depth in Salah."
    },
    "Saud Al-Shuraim": {
        "arabic_name": "سعود الشريم",
        "country": "Saudi Arabia",
        "style": "Haramayn Fast Tarteel",
        "riwayah": "Hafs 'an 'Asim",
        "biography": "Former senior Imam and Khateeb of Masjid al-Haram, legendary for his fast, rhythmic tempo and razor-sharp consonant stops."
    }
}

def load_all_qaris_list() -> List[Dict[str, Any]]:
    """Loads all 242 Qari profiles from vector_db.json merged with biographical metadata."""
    qari_list = []
    vector_path = Path(VECTOR_DB_PATH)
    
    qari_names = []
    if vector_path.exists():
        try:
            with vector_path.open("r", encoding="utf-8") as f:
                raw_db = json.load(f)
            
            if isinstance(raw_db, dict) and "profiles" in raw_db:
                for q_id, p in raw_db["profiles"].items():
                    name = p.get("qari_name") or q_id
                    if name not in qari_names:
                        qari_names.append(name)
            elif isinstance(raw_db, dict):
                qari_names = list(raw_db.keys())
            
            qari_names.sort()
        except Exception:
            qari_names = list(FAMOUS_QARI_BIOS.keys())
    else:
        qari_names = list(FAMOUS_QARI_BIOS.keys())

    for idx, name in enumerate(qari_names, start=1):
        bio_info = FAMOUS_QARI_BIOS.get(name, {})
        qari_list.append({
            "id": f"qri_{idx:03d}",
            "name": name,
            "arabic_name": bio_info.get("arabic_name", name),
            "country": bio_info.get("country", "International"),
            "style": bio_info.get("style", "Murattal"),
            "riwayah": bio_info.get("riwayah", "Hafs 'an 'Asim"),
            "biography": bio_info.get("biography", f"Authentic Quranic reciter featured in the Itqān 242-profile acoustic vector database."),
            "has_embedding": True
        })
    return qari_list

