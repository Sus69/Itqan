"""
24-Level Tajweed Syllabus Dataset aligned with tajweed_syllabus.md and INFO.md
"""

TAJWEED_MODULES = [
    {
        "module_id": "m1_foundations",
        "title": "Module 1: Foundations & Essential Rules",
        "arabic_title": "المبادئ والقواعد الأساسية",
        "description": "Fundamental pronunciation principles including Waqf stops and basic vowels.",
        "rules": [
            {
                "rule_id": "1.1",
                "name": "Waqf & Stopping Signs",
                "arabic_name": "علامات الوقف",
                "tier": 1,
                "description": "Stopping rules on Quranic punctuation marks (مـ, لا, ج, صلى, قلى, ۚ).",
                "target_ayah": {
                    "surah_number": 1,
                    "surah_name": "Al-Fatihah",
                    "ayah_number": 2,
                    "text_uthmani": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
                    "translation_en": "[All] praise is [due] to Allah, Lord of the worlds."
                }
            },
            {
                "rule_id": "1.2",
                "name": "Sajdah at-Tilawah",
                "arabic_name": "سجدة التلاوة",
                "tier": 1,
                "description": "Prostration triggers across the 14 Quranic Sajdah passages.",
                "target_ayah": {
                    "surah_number": 96,
                    "surah_name": "Al-'Alaq",
                    "ayah_number": 19,
                    "text_uthmani": "كَلَّا لَا تُطِعْهُ وَاسْجُدْ وَاقْتَرِبْ",
                    "translation_en": "No! Do not obey him. But prostrate and draw near [to Allah]."
                }
            }
        ]
    },
    {
        "module_id": "m2_makharij",
        "title": "Module 2: Makharij (Points of Articulation)",
        "arabic_title": "مخارج الحروف",
        "description": "Anatomical places of origin for all 29 Arabic phonemes.",
        "rules": [
            {
                "rule_id": "2.1",
                "name": "Throat Letters (Halq)",
                "arabic_name": "حروف الحلق",
                "tier": 2,
                "description": "Deep, middle, and upper throat letters (ء هـ ع ح غ خ).",
                "target_ayah": {
                    "surah_number": 113,
                    "surah_name": "Al-Falaq",
                    "ayah_number": 3,
                    "text_uthmani": "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
                    "translation_en": "And from the evil of darkness when it settles."
                }
            },
            {
                "rule_id": "2.2",
                "name": "Tongue Letters (Lisaan)",
                "arabic_name": "حروف اللسان",
                "tier": 2,
                "description": "Deep tongue, central tongue, lateral edges, and tongue tip letters.",
                "target_ayah": {
                    "surah_number": 112,
                    "surah_name": "Al-Ikhlas",
                    "ayah_number": 1,
                    "text_uthmani": "قُلْ هُوَ اللَّهُ أَحَدٌ",
                    "translation_en": "Say, 'He is Allah, [who is] One.'"
                }
            },
            {
                "rule_id": "2.3",
                "name": "Lip Letters (Shafatayn)",
                "arabic_name": "حروف الشفتين",
                "tier": 2,
                "description": "Labial articulation: Fa (ف), Ba (ب), Meem (م), and Waw (و).",
                "target_ayah": {
                    "surah_number": 111,
                    "surah_name": "Al-Masad",
                    "ayah_number": 1,
                    "text_uthmani": "تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ",
                    "translation_en": "May the hands of Abu Lahab be ruined, and ruined is he."
                }
            },
            {
                "rule_id": "2.4",
                "name": "Nasal Cavity (Khayshoom)",
                "arabic_name": "الخيشوم",
                "tier": 2,
                "description": "Nasal cavity resonance generating the Ghunnah sound.",
                "target_ayah": {
                    "surah_number": 114,
                    "surah_name": "An-Nas",
                    "ayah_number": 1,
                    "text_uthmani": "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
                    "translation_en": "Say, 'I seek refuge in the Lord of mankind.'"
                }
            }
        ]
    },
    {
        "module_id": "m3_sifaat",
        "title": "Module 3: Sifaat (Characteristics of Letters)",
        "arabic_title": "صفات الحروف",
        "description": "Permanent and conditional acoustic characteristics of letters.",
        "rules": [
            {
                "rule_id": "3.1",
                "name": "Hams & Jahr (Whisper vs Clear Voice)",
                "arabic_name": "الهمس والجهر",
                "tier": 3,
                "description": "Breath continuation letters (فحثه شخص سكت) vs breath arrest letters.",
                "target_ayah": {
                    "surah_number": 103,
                    "surah_name": "Al-'Asr",
                    "ayah_number": 1,
                    "text_uthmani": "وَالْعَصْرِ",
                    "translation_en": "By time,"
                }
            },
            {
                "rule_id": "3.2",
                "name": "Shiddah & Rikhwah (Strength vs Softness)",
                "arabic_name": "الشدة والرخاوة والتوسط",
                "tier": 3,
                "description": "Sound blockage (أجد قط بكت) vs moderate flow (لن عمر) vs continuous flow.",
                "target_ayah": {
                    "surah_number": 1,
                    "surah_name": "Al-Fatihah",
                    "ayah_number": 1,
                    "text_uthmani": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                    "translation_en": "In the name of Allah, the Entirely Merciful, the Especially Merciful."
                }
            },
            {
                "rule_id": "3.3",
                "name": "Tafkheem & Tarqeeq (Heavy vs Light)",
                "arabic_name": "التفخيم والترقيق",
                "tier": 3,
                "description": "Elevation of back of tongue for heavy letters (خص ضغط قظ) with F2 formant resonance.",
                "target_ayah": {
                    "surah_number": 1,
                    "surah_name": "Al-Fatihah",
                    "ayah_number": 6,
                    "text_uthmani": "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
                    "translation_en": "Guide us to the straight path."
                }
            },
            {
                "rule_id": "3.4",
                "name": "Qalqalah (Echoing Plosive Burst)",
                "arabic_name": "القلقلة",
                "tier": 3,
                "description": "Plosive release burst on Saakin letters (ق ط ب ج د).",
                "target_ayah": {
                    "surah_number": 112,
                    "surah_name": "Al-Ikhlas",
                    "ayah_number": 3,
                    "text_uthmani": "لَمْ يَلِدْ وَلَمْ يُولَدْ",
                    "translation_en": "He neither begets nor is born,"
                }
            }
        ]
    },
    {
        "module_id": "m4_noon_saakin",
        "title": "Module 4: Rules of Noon Saakin & Tanween",
        "arabic_title": "أحكام النون الساكنة والتنوين",
        "description": "The four classic transformations of Noon Saakin and Tanween.",
        "rules": [
            {
                "rule_id": "4.1",
                "name": "Izhar Halqi (Clear Pronunciation)",
                "arabic_name": "الإظهار الحلقي",
                "tier": 4,
                "description": "Clear Noon sound before the 6 throat letters (ء هـ ع ح غ خ).",
                "target_ayah": {
                    "surah_number": 108,
                    "surah_name": "Al-Kawthar",
                    "ayah_number": 2,
                    "text_uthmani": "فَصَلِّ لِرَبِّكَ وَانْحَرْ",
                    "translation_en": "So pray to your Lord and sacrifice [to Him alone]."
                }
            },
            {
                "rule_id": "4.2",
                "name": "Idgham with Ghunnah",
                "arabic_name": "الإدغام بغنة",
                "tier": 4,
                "description": "Merging Noon Saakin with 2-count nasalization before (ي ن م و).",
                "target_ayah": {
                    "surah_number": 99,
                    "surah_name": "Az-Zalzalah",
                    "ayah_number": 7,
                    "text_uthmani": "فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ",
                    "translation_en": "So whoever does an atom's weight of good will see it."
                }
            },
            {
                "rule_id": "4.3",
                "name": "Idgham without Ghunnah",
                "arabic_name": "الإدغام بغير غنة",
                "tier": 4,
                "description": "Complete merging without nasal sound before (ل ، ر).",
                "target_ayah": {
                    "surah_number": 112,
                    "surah_name": "Al-Ikhlas",
                    "ayah_number": 4,
                    "text_uthmani": "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
                    "translation_en": "Nor is there to Him any equivalent."
                }
            },
            {
                "rule_id": "4.4",
                "name": "Iqlab (Conversion to Meem)",
                "arabic_name": "الإقلاب",
                "tier": 4,
                "description": "Converting Noon into a hidden Meem with Ghunnah before Ba (ب).",
                "target_ayah": {
                    "surah_number": 90,
                    "surah_name": "Al-Balad",
                    "ayah_number": 2,
                    "text_uthmani": "وَأَنتَ حِلٌّ بِهَٰذَا الْبَلَدِ",
                    "translation_en": "And you, [O Muhammad], are free of restriction in this city."
                }
            },
            {
                "rule_id": "4.5",
                "name": "Ikhfa Haqiqi (Hiding)",
                "arabic_name": "الإخفاء الحقيقي",
                "tier": 4,
                "description": "Concealing Noon Saakin with 2-count Ghunnah before the 15 Ikhfa letters.",
                "target_ayah": {
                    "surah_number": 113,
                    "surah_name": "Al-Falaq",
                    "ayah_number": 2,
                    "text_uthmani": "مِن شَرِّ مَا خَلَقَ",
                    "translation_en": "From the evil of that which He created."
                }
            }
        ]
    },
    {
        "module_id": "m5_meem_saakin",
        "title": "Module 5: Rules of Meem Saakin",
        "arabic_title": "أحكام الميم الساكنة",
        "description": "The three pronunciation states of Meem Saakin.",
        "rules": [
            {
                "rule_id": "5.1",
                "name": "Ikhfa Shafawi",
                "arabic_name": "الإخفاء الشفوي",
                "tier": 5,
                "description": "Hiding Meem Saakin before Ba (ب) with light lip closure and Ghunnah.",
                "target_ayah": {
                    "surah_number": 105,
                    "surah_name": "Al-Fil",
                    "ayah_number": 4,
                    "text_uthmani": "تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ",
                    "translation_en": "Striking them with stones of hard clay,"
                }
            },
            {
                "rule_id": "5.2",
                "name": "Idgham Shafawi (Mithlayn)",
                "arabic_name": "الإدغام الشفوي",
                "tier": 5,
                "description": "Merging Meem Saakin into a following Meem (مّ) with full Ghunnah.",
                "target_ayah": {
                    "surah_number": 106,
                    "surah_name": "Quraysh",
                    "ayah_number": 4,
                    "text_uthmani": "الَّذِي أَطْعَمَهُم مِّن جُوعٍ وَآمَنَهُم مِّنْ خَوْفٍ",
                    "translation_en": "Who has fed them, [saving them] from hunger and made them safe, [saving them] from fear."
                }
            },
            {
                "rule_id": "5.3",
                "name": "Izhar Shafawi",
                "arabic_name": "الإظهار الشفوي",
                "tier": 5,
                "description": "Pronouncing Meem clearly before all remaining 26 letters.",
                "target_ayah": {
                    "surah_number": 1,
                    "surah_name": "Al-Fatihah",
                    "ayah_number": 7,
                    "text_uthmani": "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
                    "translation_en": "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray."
                }
            }
        ]
    },
    {
        "module_id": "m6_madd",
        "title": "Module 6: Rules of Madd (Elongation)",
        "arabic_title": "أحكام المدود",
        "description": "Timing and duration rules for vowel elongations (2, 4, 5, or 6 Harakaat).",
        "rules": [
            {
                "rule_id": "6.1",
                "name": "Madd Tabee'ee (Natural Madd)",
                "arabic_name": "المد الطبيعي (الأصلي)",
                "tier": 6,
                "description": "Standard 2-count elongation for Alif, Waw, and Yaa without Hamzah or Sukoon.",
                "target_ayah": {
                    "surah_number": 109,
                    "surah_name": "Al-Kafirun",
                    "ayah_number": 2,
                    "text_uthmani": "لَا أَعْبُدُ مَا تَعْبُدُونَ",
                    "translation_en": "I do not worship what you worship."
                }
            },
            {
                "rule_id": "6.2",
                "name": "Madd Muttasil (Connected Madd)",
                "arabic_name": "المد المتصل",
                "tier": 6,
                "description": "Madd letter followed by Hamzah in the SAME word (4-5 counts mandatory).",
                "target_ayah": {
                    "surah_number": 110,
                    "surah_name": "An-Nasr",
                    "ayah_number": 1,
                    "text_uthmani": "إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ",
                    "translation_en": "When the victory of Allah has come and the conquest,"
                }
            },
            {
                "rule_id": "6.3",
                "name": "Madd Munfasil (Separated Madd)",
                "arabic_name": "المد المنفصل",
                "tier": 6,
                "description": "Madd letter at end of word followed by Hamzah at start of next word (4-5 counts).",
                "target_ayah": {
                    "surah_number": 108,
                    "surah_name": "Al-Kawthar",
                    "ayah_number": 1,
                    "text_uthmani": "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ",
                    "translation_en": "Indeed, We have granted you, [O Muhammad], al-Kawthar."
                }
            },
            {
                "rule_id": "6.4",
                "name": "Madd Lazim (Compulsory 6-Count)",
                "arabic_name": "المد اللازم",
                "tier": 6,
                "description": "Madd letter followed by an original Sukoon or Shaddah (strict 6 counts).",
                "target_ayah": {
                    "surah_number": 1,
                    "surah_name": "Al-Fatihah",
                    "ayah_number": 7,
                    "text_uthmani": "وَلَا الضَّالِّينَ",
                    "translation_en": "nor of those who are astray."
                }
            },
            {
                "rule_id": "6.5",
                "name": "Madd 'Aaridh li-Sukoon",
                "arabic_name": "المد العارض للسكون",
                "tier": 6,
                "description": "Madd before temporary stopping Sukoon (2, 4, or 6 counts permitted).",
                "target_ayah": {
                    "surah_number": 1,
                    "surah_name": "Al-Fatihah",
                    "ayah_number": 2,
                    "text_uthmani": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
                    "translation_en": "[All] praise is [due] to Allah, Lord of the worlds."
                }
            }
        ]
    }
]

def get_all_rules_flat():
    rules = []
    for mod in TAJWEED_MODULES:
        for r in mod["rules"]:
            rules.append({**r, "module_id": mod["module_id"], "module_title": mod["title"]})
    return rules

def get_rule_by_id(rule_id: str):
    for mod in TAJWEED_MODULES:
        for r in mod["rules"]:
            if r["rule_id"] == rule_id:
                return {**r, "module_id": mod["module_id"], "module_title": mod["title"]}
    return None
