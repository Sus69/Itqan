"""
Dataset of the 5 Main Areas & 17 Specific Articulation Points (Makhaarij al-Huroof)
"""

MAKHAARIJ_AREAS = [
    {
        "area_id": "al_jawf",
        "name": "Al-Jawf (The Oral & Throat Cavity)",
        "arabic_name": "الجوف",
        "description": "The open space inside the mouth and throat through which the three elongated Madd vowels flow freely.",
        "points": [
            {
                "id": "jawf_madd",
                "name": "The Letters of Madd",
                "arabic_name": "حروف المد الثلاثة",
                "letters": ["ا", "و", "ي"],
                "description": "Alif preceded by Fathah, Waw Saakin preceded by Dhammah, and Yaa Saakin preceded by Kasrah.",
                "acoustic_clue": "Harmonic formant resonances without contact friction."
            }
        ]
    },
    {
        "area_id": "al_halq",
        "name": "Al-Halq (The Throat)",
        "arabic_name": "الحلق",
        "description": "The throat contains three distinct sub-regions producing the 6 Izhar throat letters.",
        "points": [
            {
                "id": "halq_deep",
                "name": "Deepest Throat (Aqsal-Halq)",
                "arabic_name": "أقصى الحلق",
                "letters": ["ء", "هـ"],
                "description": "Vocal cords area nearest to the chest.",
                "acoustic_clue": "Glottal stop (Hamzah) and voiceless glottal fricative (Haa)."
            },
            {
                "id": "halq_middle",
                "name": "Middle Throat (Wasat al-Halq)",
                "arabic_name": "وسط الحلق",
                "letters": ["ع", "ح"],
                "description": "Epiglottis and pharyngeal wall area.",
                "acoustic_clue": "Voiced pharyngeal fricative ('Ayn) and unvoiced whisper (Haa)."
            },
            {
                "id": "halq_upper",
                "name": "Closest Throat (Adnal-Halq)",
                "arabic_name": "أدنى الحلق",
                "letters": ["غ", "خ"],
                "description": "Top of throat near the uvula and soft palate.",
                "acoustic_clue": "Velar/uvular frication with low F2 formant (heavy letters)."
            }
        ]
    },
    {
        "area_id": "al_lisaan",
        "name": "Al-Lisaan (The Tongue)",
        "arabic_name": "اللسان",
        "description": "The most versatile organ with 10 articulation points producing 18 letters.",
        "points": [
            {
                "id": "lisaan_deep_qaf",
                "name": "Deepest Tongue - Qaf",
                "arabic_name": "أقصى اللسان - القاف",
                "letters": ["ق"],
                "description": "Back of tongue against the soft palate.",
                "acoustic_clue": "Uvular plosive stop with acoustic release burst (Qalqalah)."
            },
            {
                "id": "lisaan_deep_kaf",
                "name": "Deepest Tongue - Kaf",
                "arabic_name": "أقصى اللسان - الكاف",
                "letters": ["ك"],
                "description": "Back of tongue slightly forward against both hard and soft palates.",
                "acoustic_clue": "Velar stop followed by aspiration whisper (Hams)."
            },
            {
                "id": "lisaan_center",
                "name": "Center of Tongue (Wasat al-Lisaan)",
                "arabic_name": "وسط اللسان",
                "letters": ["ج", "ش", "ي"],
                "description": "Center of tongue raised towards the hard palate.",
                "acoustic_clue": "Palatal affricate (Jeem), palato-alveolar fricative (Sheen), and palatal glide (Yaa)."
            },
            {
                "id": "lisaan_edge_daad",
                "name": "Lateral Edge - Daad",
                "arabic_name": "حافة اللسان - الضاد",
                "letters": ["ض"],
                "description": "Side edge of tongue pressed against upper molars with Istitalah elongation.",
                "acoustic_clue": "Low F2 formant, lateral closure pressure, and prolonged sound."
            },
            {
                "id": "lisaan_edge_laam",
                "name": "Front Side Edge - Laam",
                "arabic_name": "طرف الحافة - اللام",
                "letters": ["ل"],
                "description": "Front lateral edge of tongue against the upper gumline.",
                "acoustic_clue": "Lateral liquid resonance."
            },
            {
                "id": "lisaan_tip_noon",
                "name": "Tongue Tip - Noon",
                "arabic_name": "طرف اللسان - النون",
                "letters": ["ن"],
                "description": "Tip of tongue touching the upper gums below Laam with nasal Ghunnah.",
                "acoustic_clue": "Alveolar nasal stop (300Hz nasal murmur)."
            },
            {
                "id": "lisaan_tip_raa",
                "name": "Tongue Tip - Raa",
                "arabic_name": "طرف اللسان - الراء",
                "letters": ["ر"],
                "description": "Tip of tongue against upper gums with slight vibration (Takreer) without excessive trill.",
                "acoustic_clue": "Alveolar tap/trill with acoustic frequency shifts between heavy and light."
            },
            {
                "id": "lisaan_tip_taa_daal_taa",
                "name": "Tongue Tip - Taa, Daal, Taa",
                "arabic_name": "طرف اللسان - الطاء والدال والتاء",
                "letters": ["ط", "د", "ت"],
                "description": "Top of tongue tip against roots of the upper front incisors.",
                "acoustic_clue": "Heavy stop (Taa) vs light stops (Daal, Taa)."
            },
            {
                "id": "lisaan_tip_saad_seen_zay",
                "name": "Tongue Tip - Saad, Seen, Zay (Safeer Whistle)",
                "arabic_name": "حروف الصفير - الصاد والسين والزاي",
                "letters": ["ص", "س", "ز"],
                "description": "Tip of tongue near inner edge of lower incisors generating high-frequency whistle.",
                "acoustic_clue": "High frequency spectral energy (4000-8000Hz)."
            },
            {
                "id": "lisaan_tip_thaa_dhal_zhaa",
                "name": "Tongue Tip - Thaa, Dhal, Zhaa (Interdental)",
                "arabic_name": "الحروف اللثوية - الظاء والذال والثاء",
                "letters": ["ظ", "ذ", "ث"],
                "description": "Tip of tongue lightly emerging between the edges of upper and lower incisors.",
                "acoustic_clue": "Dental frication."
            }
        ]
    },
    {
        "area_id": "ash_shafatayn",
        "name": "Ash-Shafatayn (The Two Lips)",
        "arabic_name": "الشفتان",
        "description": "The lips produce 4 distinct letters.",
        "points": [
            {
                "id": "shafatayn_faa",
                "name": "Inside Lower Lip - Faa",
                "arabic_name": "بطن الشفة السفلى - الفاء",
                "letters": ["ف"],
                "description": "Inner part of lower lip against edges of upper incisors.",
                "acoustic_clue": "Labiodental fricative with continuous air (Hams)."
            },
            {
                "id": "shafatayn_closed",
                "name": "Both Lips - Baa, Meem, Waw",
                "arabic_name": "بين الشفتين - الباء والميم والواو",
                "letters": ["ب", "م", "و"],
                "description": "Closing both lips tightly (Baa), lightly with Ghunnah (Meem), and rounding without complete closure (Waw).",
                "acoustic_clue": "Bilabial plosive, nasal murmur, and rounded labial glide."
            }
        ]
    },
    {
        "area_id": "al_khayshoom",
        "name": "Al-Khayshoom (The Nasal Passage)",
        "arabic_name": "الخيشوم",
        "description": "The passage connecting the top of the nose to the pharynx, producing Ghunnah.",
        "points": [
            {
                "id": "khayshoom_ghunnah",
                "name": "The Origin of Ghunnah",
                "arabic_name": "مخرج الغنة",
                "letters": ["نّ", "مّ"],
                "description": "A sweet, resonant nasal hum inherent to Noon and Meem, held for 2 counts.",
                "acoustic_clue": "Strong spectral energy ratio in 200-450Hz band relative to oral spectrum."
            }
        ]
    }
]

def get_all_makharij():
    return MAKHAARIJ_AREAS
