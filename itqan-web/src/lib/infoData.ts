export interface QuranExtract {
  id: string;
  surah: number | string;
  ayah: number | string;
  text: string;
  ruleTarget?: string;
  ruleType?: string;
  attachedText?: string;
  precededText?: string;
  page?: number | string;
  sajdaNo?: number;
}

export interface MakhaarijRow {
  group: string;
  letters: string;
  origin: string;
}

export interface TajweedSubChapter {
  id: string;
  title: string;
  arabicTitle?: string;
  description?: string;
  urduNote?: string;
  ruleLetters?: string[];
  mnemonic?: string;
  duration?: string;
  makhaarijRows?: MakhaarijRow[];
  examples?: QuranExtract[];
  extraNotes?: string[];
}

export interface TajweedChapter {
  id: string;
  chapterNumber: number;
  title: string;
  arabicTitle: string;
  category: 'foundations' | 'makhraj' | 'rules_noon_meem' | 'rules_letters' | 'madd' | 'waqf_sajdah';
  summary: string;
  subChapters: TajweedSubChapter[];
}

export const TAJWEED_INFO_CHAPTERS: TajweedChapter[] = [
  {
    id: 'aadaab',
    chapterNumber: 1,
    title: 'The Aadaab of Reciting the Holy Qur’an',
    arabicTitle: 'تلاوتِ قرآنِ مجید کے آداب',
    category: 'foundations',
    summary: 'Essential spiritual and physical etiquettes required before commencing Quranic recitation.',
    subChapters: [
      {
        id: 'aadaab-rules',
        title: 'Etiquettes & Preparations',
        arabicTitle: 'آداب وتوجيهات',
        description: 'Key obligations and recommended actions for every reciter.',
        extraNotes: [
          'The reciter of the Holy Qur’an must perform the ritual ablution (Wudhu).',
          'The intention when reciting the Holy Qur’an should be solely to gain the pleasure of Allah.',
          'The voice should not be raised to such an extent where your recital will disturb others who are also engaged in worship.',
          'The reciter of the Holy Qur’an must sit in a dignified position facing the Ka’bah.',
        ],
      },
      {
        id: 'aadaab-initiation',
        title: 'Initiation Formulas (Ta’awwudh & Basmalah)',
        arabicTitle: 'الاستعاذة والبسملة',
        description: 'Always commence recitation with Ta’awwudh followed by Basmalah.',
        examples: [
          {
            id: 'taawwudh',
            surah: 'Initiation',
            ayah: 'Formula 1',
            text: 'أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
            ruleTarget: 'Isti’adha',
            ruleType: 'Mandatory start',
          },
          {
            id: 'basmalah',
            surah: 'Initiation',
            ayah: 'Formula 2',
            text: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ',
            ruleTarget: 'Basmalah',
            ruleType: 'Beginning of Surah',
          },
        ],
      },
    ],
  },
  {
    id: 'makhraj',
    chapterNumber: 2,
    title: 'Places of Origin of the Arabic Letters (Makhaarij)',
    arabicTitle: 'مخارج الحروف العربية',
    category: 'makhraj',
    summary: 'The universal discovery algorithm and exact articulation points (Makhaarij) for all Arabic letters.',
    subChapters: [
      {
        id: 'makhraj-algorithm',
        title: 'The Makhraj Discovery Algorithm',
        arabicTitle: 'معرفة مخرج الحرف',
        description:
          'To locate the place of origin (Makhraj) of any Arabic letter: 1) Place a Sukoon (ْ) on the target letter. 2) Precede it with an Alif (ا) carrying a Fathah (َ).',
        mnemonic: 'Example: اَبْ reveals the Makhraj of ب at the lips.',
      },
      {
        id: 'makhraj-table',
        title: 'Comprehensive Table of Makhaarij',
        arabicTitle: 'جدول مخارج الحروف التفصيلي',
        description: 'Complete breakdown of letter articulation points.',
        makhaarijRows: [
          { group: 'The Aerial Letters', letters: 'ا ، و ، ي', origin: 'Originates from the emptiness (open cavity) of the mouth.' },
          { group: 'The Guttural Letters (Back)', letters: 'ء ، هـ', origin: 'Originates from the back of the throat (larynx).' },
          { group: 'The Guttural Letters (Middle)', letters: 'ع ، ح', origin: 'Originates from the centre (middle) of the throat.' },
          { group: 'The Guttural Letters (Upper)', letters: 'غ ، خ', origin: 'Originates from the upper portion of the throat.' },
          { group: 'Velar Letters', letters: 'ق ، ك', origin: 'The back of the tongue rises and touches the soft palate.' },
          { group: 'Palatal Letters', letters: 'ج ، ش ، ي', origin: 'The centre of the tongue touches the upper palate.' },
          { group: 'The Letter Dhad', letters: 'ض', origin: 'The turned side of the tongue touches the gums of the upper back teeth.' },
          { group: 'The Liquids', letters: 'ل ، ر ، ن', origin: 'Originates when the tongue touches the upper hard palate.' },
          { group: 'The Dental Letters', letters: 'ت ، د ، ط', origin: 'Originates when the tip of the tongue touches the gums of the upper two front teeth.' },
          { group: 'The Gingival Letters', letters: 'ث ، ذ ، ظ', origin: 'Originates when the tip of the tongue touches the edge of the upper two front teeth.' },
          { group: 'Tip of the Tongue', letters: 'س ، ص ، ز', origin: 'Originates when the tip of the tongue rises towards the upper palate and touches the gums behind the upper two front teeth.' },
          { group: 'The Labial Letters', letters: 'ب ، م', origin: 'Originates from the lips.' },
          { group: 'The Labial Letter Fa', letters: 'ف', origin: 'Originates when the inner portion of the bottom lip meets the edge of the two upper front teeth.' },
        ],
      },
    ],
  },
  {
    id: 'tajweed-definition',
    chapterNumber: 3,
    title: 'Tajweed Definition & Purpose',
    arabicTitle: 'تعريف علم التجويد',
    category: 'foundations',
    summary: 'The core purpose and sonic goals of reciting with Tajweed.',
    subChapters: [
      {
        id: 'tajweed-overview',
        title: 'Definition of Tajweed',
        arabicTitle: 'غاية التجويد',
        description:
          'Reciting the Holy Qur’an with Tajweed means to pronounce every letter with all its articulative qualities such as correct prolongation, merging, conversion, distinctness, and pauses. Reciting with Tajweed allows the reciter to emphasize the accent, phonetics, rhythm, and temper of Quranic recitation.',
      },
    ],
  },
  {
    id: 'qalqala',
    chapterNumber: 4,
    title: 'Qalqala (Echo Mechanics)',
    arabicTitle: 'أحكام القلقلة',
    category: 'rules_letters',
    summary: 'Echoing or jerking sound produced when Qalqala letters carry a Sukoon or when stopping upon them.',
    subChapters: [
      {
        id: 'qalqala-standard',
        title: 'Standard Qalqala (Mid-word / Saakin)',
        arabicTitle: 'القلقلة الساكنة',
        description:
          'When the letters of Qalqala have a Sukoon (ْ) on them, they are read with an echoing or jerking sound. Care should be taken not to exaggerate the echo to the point where the letter sounds like it carries a Fathah.',
        ruleLetters: ['ق', 'ط', 'ب', 'ج', 'د'],
        mnemonic: 'Mnemonic phrase: قطب جد',
        examples: [
          { id: 'q-std-1', surah: 7, ayah: 12, text: 'خَلَقْتَنِي مِن نَّارٍ وَخَلَقْتَهُ مِن', ruleTarget: 'ق' },
          { id: 'q-std-2', surah: 37, ayah: 10, text: 'خَطِفَ الْخَطْفَةَ فَأَتْبَعَهُ شِهَابٌ ثَاقِبٌ', ruleTarget: 'ط' },
          { id: 'q-std-3', surah: 2, ayah: 34, text: 'قُلْنَا لِلْمَلَائِكَةِ اسْجُدُوا لِآدَمَ فَسَجَدُوا إِلَّا إِبْلِيسَ', ruleTarget: 'ب' },
          { id: 'q-std-4', surah: 37, ayah: 19, text: 'فَإِنَّمَا هِيَ زَجْرَةٌ وَاحِدَةٌ فَإِذَا هُمْ يَنظُرُونَ', ruleTarget: 'ج' },
          { id: 'q-std-5', surah: 33, ayah: 4, text: 'مَا جَعَلَ اللَّهُ لِرَجُلٍ مِّن قَلْبَيْنِ فِي جَوْفِهِ', ruleTarget: 'د' },
        ],
      },
      {
        id: 'qalqala-stop',
        title: 'Qalqala Mouquf (Stopping on Qalqala)',
        arabicTitle: 'القلقلة عند الوقف',
        description:
          'When a stop (Waqf) is made at the end of a verse/word on a Qalqala letter, the last letter becomes Saakin (ْ) irrespective of its original vowel sign, resulting in a stronger echoing sound.',
        ruleLetters: ['ق', 'ط', 'ب', 'ج', 'د'],
        examples: [
          { id: 'q-stop-1', surah: 37, ayah: 5, text: 'وَمَا بَيْنَهُمَا وَرَبُّ الْمَشَارِقِ', ruleTarget: 'ق' },
          { id: 'q-stop-2', surah: 11, ayah: 70, text: 'إِنَّا أُرْسِلْنَا إِلَىٰ قَوْمِ لُوطٍ', ruleTarget: 'ط' },
          { id: 'q-stop-3', surah: 37, ayah: 10, text: 'خَطِفَ الْخَطْفَةَ فَأَتْبَعَهُ شِهَابٌ ثَاقِبٌ', ruleTarget: 'ب' },
          { id: 'q-stop-4', surah: 2, ayah: 197, text: 'وَلَا فُسُوقَ وَلَا جِدَالَ فِي الْحَجِّ', ruleTarget: 'ج' },
          { id: 'q-stop-5', surah: 37, ayah: 7, text: 'وَحِفْظًا مِن كُلِّ شَيْطَانٍ مَّارِدٍ', ruleTarget: 'د' },
        ],
      },
    ],
  },
  {
    id: 'noon-meem-mushaddadah',
    chapterNumber: 5,
    title: 'Noon and Meem Mushaddadah',
    arabicTitle: 'النون والميم المشددتان',
    category: 'rules_noon_meem',
    summary: 'Mandatory nasalization (Ghunnah) duration when Noon or Meem carry a Shaddah.',
    subChapters: [
      {
        id: 'nm-mushaddadah-rules',
        title: 'Nasalization (Ghunnah) Duration',
        arabicTitle: 'الغنة في النون والميم',
        description:
          'When the letters Noon (ن) and Meem (م) carry a Shaddah (ّ), they must be recited with Ghunnah (nasal sound). The duration of Ghunnah should not exceed 2 Harakaat (approx 2–3 seconds).',
        duration: '2 Harakaat (2–3 seconds)',
        ruleLetters: ['نّ', 'مّ'],
        examples: [
          { id: 'nm-1', surah: 37, ayah: 6, text: 'إِنَّا زَيَّنَّا السَّمَاءَ الدُّنْيَا', ruleTarget: 'نّ' },
          { id: 'nm-2', surah: 78, ayah: 21, text: 'إِنَّ جَهَنَّمَ كَانَتْ مِرْصَادًا', ruleTarget: 'نّ' },
          { id: 'nm-3', surah: 27, ayah: 70, text: 'وَلَا تَحْزَنْ عَلَيْهِمْ وَضِقْ بِمَا يَمْكُرُونَ', ruleTarget: 'مّ' },
          { id: 'nm-4', surah: 7, ayah: 11, text: 'ثُمَّ قُلْنَا لِلْمَلَائِكَةِ اسْجُدُوا', ruleTarget: 'مّ' },
        ],
      },
    ],
  },
  {
    id: 'laam-allah',
    chapterNumber: 6,
    title: 'The Rule of the Letter Laam (ل)',
    arabicTitle: 'أحكام لام لفظ الجلالة',
    category: 'rules_letters',
    summary: 'Heavy (Tafkheem) vs Light (Tarqeeq) pronunciation of the letter Laam in the name of Allah.',
    subChapters: [
      {
        id: 'laam-heavy',
        title: 'Heavy / Full Mouth Laam (Tafkheem)',
        arabicTitle: 'تفخيم لام لفظ الجلالة',
        description:
          'When a letter carrying a Fathah (َ) or Dhammah (ُ) appears immediately before the name of Allah (اللّٰه), the Laam is pronounced with a broad (heavy / full mouth) sound.',
        examples: [
          { id: 'laam-h1', surah: 5, ayah: 114, text: 'قَالَ عِيسَى ابْنُ مَرْيَمَ اللَّهُمَّ', ruleTarget: 'Fathah (َ) before Allah' },
          { id: 'laam-h2', surah: 4, ayah: 171, text: 'إِنَّمَا الْمَسِيحُ عِيسَى ابْنُ مَرْيَمَ رَسُولُ اللَّهِ', ruleTarget: 'Dhammah (ُ) before Allah' },
        ],
      },
      {
        id: 'laam-light',
        title: 'Thin / Empty Mouth Laam (Tarqeeq)',
        arabicTitle: 'ترقيق لام لفظ الجلالة',
        description:
          'When a letter carrying a Kasrah (ِ) appears immediately before the name of Allah (اللّٰه), the Laam is pronounced with a thin (light / empty mouth) sound.',
        examples: [
          { id: 'laam-l1', surah: 40, ayah: 78, text: 'لِرَسُولٍ أَن يَأْتِيَ بِآيَةٍ إِلَّا بِإِذْنِ اللَّهِ', ruleTarget: 'Kasrah (ِ) before Allah' },
          { id: 'laam-l2', surah: 4, ayah: 35, text: 'يُوَفِّقِ اللَّهُ بَيْنَهُمَا', ruleTarget: 'Kasrah (ِ) before Allah' },
        ],
      },
      {
        id: 'laam-mushaddadah-exc',
        title: 'Exception: Laam Mushaddadah (لّ)',
        arabicTitle: 'استثناء اللام المشددة',
        description: 'The Laam Mushaddadah (لّ) is ALWAYS pronounced with a thin (light) sound, regardless of the preceding vowel.',
        examples: [
          { id: 'laam-ex1', surah: 2, ayah: 255, text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', ruleTarget: 'لّ' },
          { id: 'laam-ex2', surah: 58, ayah: 20, text: 'يُحَادُّونَ اللَّهَ وَرَسُولَهُ أُولَٰئِكَ فِي الْأَذَلِّينَ', ruleTarget: 'لّ' },
          { id: 'laam-ex3', surah: 2, ayah: 177, text: 'لَيْسَ الْبِرَّ أَن تُوَلُّوا وُجُوهَكُمْ قِبَلَ', ruleTarget: 'لّ' },
          { id: 'laam-ex4', surah: 2, ayah: 148, text: 'وَلِكُلٍّ وِجْهَةٌ هُوَ مُوَلِّيهَا فَاسْتَبِقُوا', ruleTarget: 'لّ' },
        ],
      },
    ],
  },
  {
    id: 'meem-saakin',
    chapterNumber: 7,
    title: 'The Rule of Meem Saakin (مْ)',
    arabicTitle: 'أحكام الميم الساكنة',
    category: 'rules_noon_meem',
    summary: 'The three distinct rules governing Meem Saakin: Ikhfa Shafawi, Idghaam Shafawi, and Ithaar Shafawi.',
    subChapters: [
      {
        id: 'ikhfa-shafawi',
        title: '1. Ikhfa Shafawi (مْ + ب)',
        arabicTitle: 'الإخفاء الشفوي',
        description:
          'When the letter Ba (ب) appears after a Meem Saakin (مْ), there will be Ikhfa Shafawi. It is pronounced with a light nasal sound (Ghunnah) for a duration of 2 Harakaat (2–3 seconds).',
        duration: '2 Harakaat (2–3 seconds)',
        ruleLetters: ['ب'],
        examples: [
          { id: 'meem-ik1', surah: 34, ayah: 8, text: 'أَفْتَرَىٰ عَلَى اللَّهِ كَذِبًا أَمْ بِهِ جِنَّةٌ', ruleTarget: 'مْ + ب' },
        ],
      },
      {
        id: 'idghaam-shafawi',
        title: '2. Idghaam Shafawi (مْ + مّ)',
        arabicTitle: 'الإدغام الشفوي',
        description:
          'If after a Meem Saakin (مْ) there appears a Meem Mushaddadah (مّ), Idghaam will occur. The two Meems merge into one and are recited with Ghunnah.',
        ruleLetters: ['م'],
        examples: [
          { id: 'meem-id1', surah: 16, ayah: 57, text: 'وَلَهُم مَّا يَشْتَهُونَ', ruleTarget: 'مْ + مّ' },
        ],
      },
      {
        id: 'ithaar-shafawi',
        title: '3. Ithaar Shafawi (مْ + 26 Remaining Letters)',
        arabicTitle: 'الإظهار الشفوي',
        description:
          'When, after a Meem Saakin (مْ), there appears any of the remaining 26 Arabic letters (any letter other than ب and م), the rule is Ithaar Shafawi. The Meem is pronounced clearly with no Ghunnah.',
        examples: [
          { id: 'meem-ith1', surah: 34, ayah: 45, text: 'وَكَذَّبَ الَّذِينَ مِن قَبْلِهِمْ وَمَا بَلَغُوا', ruleTarget: 'مْ followed by 26 letters' },
        ],
      },
    ],
  },
  {
    id: 'ikhfa-noon',
    chapterNumber: 8,
    title: 'Ikhfa – Noon Saakin and Tanween',
    arabicTitle: 'إخفاء النون الساكنة والتنوين',
    category: 'rules_noon_meem',
    summary: 'Concealment (Ikhfa) with light Ghunnah when Noon Saakin or Tanween is followed by any of the 15 Ikhfa letters.',
    subChapters: [
      {
        id: 'ikhfa-noon-all',
        title: 'The 15 Letters of Ikhfa',
        arabicTitle: 'حروف الإخفاء الخمسة عشر',
        description:
          'If any of the 15 letters of Ikhfa come after a Noon Saakin (نْ) or Tanween (ً ٍ ٌ), the word is recited with a light nasal sound (Ghunnah) through the nose for 2 Harakaat (approx 2–3 seconds).',
        duration: '2 Harakaat (2–3 seconds)',
        ruleLetters: ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'],
        examples: [
          { id: 'ikh-ta-1', surah: 5, ayah: 118, text: 'وَإِن تَغْفِرْ لَهُمْ فَإِنَّكَ', ruleTarget: 'ت' },
          { id: 'ikh-ta-2', surah: 5, ayah: 119, text: 'لَهُمْ جَنَّاتٌ تَجْرِي مِن تَحْتِهَا', ruleTarget: 'ت' },
          { id: 'ikh-tha-1', surah: 13, ayah: 8, text: 'يَعْلَمُ كُلَّ أُنثَىٰ وَمَا تَغِيضُ الْأَرْحَامُ', ruleTarget: 'ث' },
          { id: 'ikh-tha-2', surah: 6, ayah: 54, text: 'سُوءٍ بِجَهَالَةٍ ثُمَّ تَابَ مِن بَعْدِهِ', ruleTarget: 'ث' },
          { id: 'ikh-ja-1', surah: 14, ayah: 6, text: 'عَلَيْكُمْ إِذْ أَنجَاكُم مِّنْ آلِ', ruleTarget: 'ج' },
          { id: 'ikh-ja-2', surah: 14, ayah: 19, text: 'بِآيَاتٍ يَخْلُقْ جَدِيدًا', ruleTarget: 'ج' },
          { id: 'ikh-dal-1', surah: 14, ayah: 22, text: 'إِن دَعَوْتُكُمْ فَاسْتَجَبْتُمْ لِي', ruleTarget: 'د' },
          { id: 'ikh-dal-2', surah: 6, ayah: 99, text: 'وَمِنَ النَّخْلِ مِن طَلْعِهَا قِنْوَانٌ دَانِيَةٌ', ruleTarget: 'د' },
          { id: 'ikh-dhal-1', surah: 5, ayah: 91, text: 'وَيَصُدَّكُمْ عَن ذِكْرِ اللَّهِ وَعَنِ', ruleTarget: 'ذ' },
          { id: 'ikh-dhal-2', surah: 3, ayah: 185, text: 'كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ', ruleTarget: 'ذ' },
          { id: 'ikh-za-1', surah: 3, ayah: 185, text: 'فَمَن زُحْزِحَ عَنِ النَّارِ وَأُدْخِلَ الْجَنَّةَ', ruleTarget: 'ز' },
          { id: 'ikh-za-2', surah: 18, ayah: 74, text: 'نَفْسًا زَكِيَّةً بِغَيْرِ نَفْسٍ', ruleTarget: 'ز' },
          { id: 'ikh-sin-1', surah: 17, ayah: 83, text: 'وَإِذَا أَنْعَمْنَا عَلَى الْإِنسَانِ', ruleTarget: 'س' },
          { id: 'ikh-sin-2', surah: 18, ayah: 22, text: 'وَيَقُولُونَ خَمْسَةٌ سَادِسُهُمْ كَلْبُهُمْ', ruleTarget: 'س' },
          { id: 'ikh-shin-1', surah: 18, ayah: 69, text: 'قَالَ سَتَجِدُنِي إِن شَاءَ اللَّهُ صَابِرًا', ruleTarget: 'ش' },
          { id: 'ikh-shin-2', surah: 17, ayah: 58, text: 'عَنْهَا شَرِيدًا أَوْ رَاكِهَا', ruleTarget: 'ش' },
          { id: 'ikh-sad-1', surah: 18, ayah: 43, text: 'وَلَمْ تَكُن لَّهُ فِئَةٌ يَنصُرُونَهُ', ruleTarget: 'ص' },
          { id: 'ikh-sad-2', surah: 33, ayah: 23, text: 'مِنَ الْمُؤْمِنِينَ رِجَالٌ صَدَقُوا مَا', ruleTarget: 'ص' },
          { id: 'ikh-dhad-1', surah: 30, ayah: 54, text: 'اللَّهُ الَّذِي خَلَقَكُم مِّن ضَعْفٍ', ruleTarget: 'ض' },
          { id: 'ikh-dhad-2', surah: 30, ayah: 54, text: 'ثُمَّ جَعَلَ مِن بَعْدِ ضَعْفٍ قُوَّةً', ruleTarget: 'ض' },
          { id: 'ikh-tah-1', surah: 32, ayah: 7, text: 'مِن طِينٍ ثُمَّ جَعَلَ نَسْلَهُ مِن سُلَالَةٍ', ruleTarget: 'ط' },
          { id: 'ikh-tah-2', surah: 34, ayah: 15, text: 'بَلْدَةٌ طَيِّبَةٌ وَرَبٌّ غَفُورٌ', ruleTarget: 'ط' },
          { id: 'ikh-zhah-1', surah: 35, ayah: 44, text: 'أَوَلَمْ يَسِيرُوا فِي الْأَرْضِ فَيَنظُرُوا كَيْفَ', ruleTarget: 'ظ' },
          { id: 'ikh-fa-1', surah: 4, ayah: 57, text: 'فَنُدْخِلُهُمْ ظِلًّا ظَلِيلًا', ruleTarget: 'ف' },
          { id: 'ikh-fa-2', surah: 4, ayah: 71, text: 'حِذْرَكُمْ فَانفِرُوا ثُبَاتٍ أَوِ انْفِرُوا جَمِيعًا', ruleTarget: 'ف' },
          { id: 'ikh-qaf-1', surah: 4, ayah: 79, text: 'مَا أَصَابَكَ مِنْ حَسَنَةٍ فَمِنَ اللَّهِ', ruleTarget: 'ق' },
          { id: 'ikh-qaf-2', surah: 4, ayah: 92, text: 'وَمَنْ قَتَلَ مُؤْمِنًا خَطَأً', ruleTarget: 'ق' },
          { id: 'ikh-kaf-1', surah: 4, ayah: 141, text: 'وَإِن كَانَ الْكَافِرِينَ نَصِيبًا', ruleTarget: 'ك' },
          { id: 'ikh-kaf-2', surah: 4, ayah: 141, text: 'وَإِن كَانَ لَكُمْ فَتْحٌ مِّنَ اللَّهِ', ruleTarget: 'ك' },
          { id: 'ikh-kaf-3', surah: 4, ayah: 31, text: 'سَيُدْخِلْكُمْ مُدْخَلًا كَرِيمًا', ruleTarget: 'ك' },
        ],
      },
    ],
  },
  {
    id: 'ithaar-noon',
    chapterNumber: 9,
    title: 'Ithaar – Noon Saakin and Tanween',
    arabicTitle: 'إظهار النون الساكنة والتنوين',
    category: 'rules_noon_meem',
    summary: 'Clear pronunciation without Ghunnah when Noon Saakin or Tanween is followed by any of the 6 Throat Letters.',
    subChapters: [
      {
        id: 'ithaar-noon-all',
        title: 'The Huroof Halqiyah (Throat Letters)',
        arabicTitle: 'حروف الحلق الستة',
        description:
          'When, after a Noon Saakin (نْ) or Tanween (ً ٍ ٌ), there appears any of the 6 throat letters (Huroof Halqiyah), it is pronounced clearly without Ghunnah.',
        ruleLetters: ['ء', 'ه', 'ع', 'ح', 'غ', 'خ'],
        examples: [
          { id: 'ith-ha-1', surah: 15, ayah: 82, text: 'مَعْرِضِينَ ۝ وَكَانُوا يَنْحِتُونَ', ruleTarget: 'ح' },
          { id: 'ith-ha-2', surah: 2, ayah: 35, text: 'وَلَا تَقْرَبَا هَٰذِهِ الشَّجَرَةَ', ruleTarget: 'ح' },
          { id: 'ith-khaa-1', surah: 4, ayah: 35, text: 'وَإِنْ خِفْتُمْ شِقَاقَ بَيْنِهِمَا فَابْعَثُوا', ruleTarget: 'خ' },
          { id: 'ith-khaa-2', surah: 4, ayah: 35, text: 'إِنَّ اللَّهَ كَانَ عَلِيمًا خَبِيرًا', ruleTarget: 'خ' },
          { id: 'ith-ayn-1', surah: 6, ayah: 54, text: 'كَتَبَ عَلَىٰ نَفْسِهِ الرَّحْمَةَ ۖ أَنَّهُ مَن عَمِلَ مِنكُمْ', ruleTarget: 'ع' },
          { id: 'ith-ayn-2', surah: 6, ayah: 54, text: 'فَقُلْ سَلَامٌ عَلَيْكُمْ كَتَبَ', ruleTarget: 'ع' },
          { id: 'ith-ghayn-1', surah: 7, ayah: 43, text: 'صُدُورِهِم مِّنْ غِلٍّ تَجْرِي مِن', ruleTarget: 'غ' },
          { id: 'ith-ghayn-2', surah: 35, ayah: 28, text: 'إِنَّ اللَّهَ عَزِيزٌ غَفُورٌ', ruleTarget: 'غ' },
          { id: 'ith-hamzah-1', surah: 5, ayah: 32, text: 'مِنْ أَجْلِ ذَٰلِكَ', ruleTarget: 'ء' },
          { id: 'ith-hamzah-2', surah: 38, ayah: 29, text: 'كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ', ruleTarget: 'ء' },
          { id: 'ith-haa-1', surah: 3, ayah: 104, text: 'وَيَأْمُرُونَ بِالْمَعْرُوفِ وَيَنْهَوْنَ', ruleTarget: 'ه' },
          { id: 'ith-haa-2', surah: 13, ayah: 7, text: 'إِنَّمَا أَنتَ مُنذِرٌ وَلِكُلِّ قَوْمٍ هَادٍ', ruleTarget: 'ه' },
        ],
      },
    ],
  },
  {
    id: 'idghaam-noon',
    chapterNumber: 10,
    title: 'Idghaam – Noon Saakin and Tanween',
    arabicTitle: 'إدغام النون الساكنة والتنوين',
    category: 'rules_noon_meem',
    summary: 'Merging (assimilation) rules with Ghunnah, without Ghunnah, and exceptions.',
    subChapters: [
      {
        id: 'idghaam-ghunnah',
        title: 'Idghaam with Ghunnah (ي ن م و)',
        arabicTitle: 'إدغام بغنة',
        description:
          'When Noon Saakin (نْ) or Tanween (ً ٍ ٌ) is followed by one of the letters ي ن م و, merging occurs with Shaddah (ّ) and Ghunnah for 2 Harakaat (2–3 seconds).',
        duration: '2 Harakaat (2–3 seconds)',
        ruleLetters: ['ي', 'ن', 'م', 'و'],
        examples: [
          { id: 'idg-y1', surah: 18, ayah: 5, text: 'إِن يَقُولُونَ', ruleTarget: 'ي' },
          { id: 'idg-y2', surah: 13, ayah: 23, text: 'عَدْنٍ يَدْخُلُونَهَا', ruleTarget: 'ي' },
          { id: 'idg-m1', surah: 2, ayah: 130, text: 'عَن مِّلَّةِ', ruleTarget: 'م' },
          { id: 'idg-m2', surah: 13, ayah: 27, text: 'آيَةٌ مِّن رَّبِّهِ', ruleTarget: 'م' },
          { id: 'idg-w1', surah: 13, ayah: 11, text: 'مِّن وَالٍ', ruleTarget: 'و' },
          { id: 'idg-w2', surah: 15, ayah: 45, text: 'جَنَّاتٍ وَعُيُونٍ', ruleTarget: 'و' },
          { id: 'idg-n1', surah: 14, ayah: 11, text: 'أَن نَّأْتِيَكُم', ruleTarget: 'ن' },
          { id: 'idg-n2', surah: 14, ayah: 44, text: 'قَرِيبٍ نُّجِبْ', ruleTarget: 'ن' },
        ],
      },
      {
        id: 'idghaam-no-ghunnah',
        title: 'Exception: Idghaam Without Ghunnah (ل ، ر)',
        arabicTitle: 'إدغام بغير غنة',
        description:
          'When Laam (ل) or Raa (ر) follows a Noon Saakin or Tanween, assimilation still occurs, but WITHOUT Ghunnah (no nasalization).',
        ruleLetters: ['ل', 'ر'],
        examples: [
          { id: 'idg-l1', surah: 36, ayah: 47, text: 'مَن لَّوْ يَشَاءُ اللَّهُ', ruleTarget: 'ل' },
          { id: 'idg-l2', surah: 2, ayah: 2, text: 'هُدًى لِّلْمُتَّقِينَ', ruleTarget: 'ل' },
          { id: 'idg-r1', surah: 2, ayah: 5, text: 'هُدًى مِّن رَّبِّهِمْ', ruleTarget: 'ر' },
          { id: 'idg-r2', surah: 2, ayah: 173, text: 'غَفُورٌ رَّحِيمٌ', ruleTarget: 'ر' },
        ],
      },
      {
        id: 'idghaam-exception-single-word',
        title: 'Exception: Single-Word Non-Assimilation',
        arabicTitle: 'استثناء الإدغام في كلمة واحدة',
        description:
          'When an Idghaam letter follows Noon Saakin within the SAME single word, assimilation does NOT take place because the letter carries no Shaddah (Izhar Mutlaq).',
        examples: [
          { id: 'idg-exc-1', surah: 30, ayah: 7, text: 'الْحَيَاةَ الدُّنْيَا', ruleTarget: 'الدُّنْيَا' },
          { id: 'idg-exc-2', surah: 61, ayah: 4, text: 'كَأَنَّهُم بُنْيَانٌ', ruleTarget: 'بُنْيَانٌ' },
          { id: 'idg-exc-3', surah: 13, ayah: 4, text: 'نَخِيلٌ صِنْوَانٌ', ruleTarget: 'صِنْوَانٌ' },
          { id: 'idg-exc-4', surah: 6, ayah: 99, text: 'طَلْعُهَا قِنْوَانٌ', ruleTarget: 'قِنْوَانٌ' },
        ],
      },
    ],
  },
  {
    id: 'idghaam-mithlayn',
    chapterNumber: 11,
    title: 'Idghaam Mithlayn (Same Kind Assimilation)',
    arabicTitle: 'إدغام المثلين',
    category: 'rules_letters',
    summary: 'Assimilation occurring when two identical letters meet (first Saakin ْ, second carrying Shaddah ّ).',
    subChapters: [
      {
        id: 'mithlayn-rules',
        title: 'Identical Letter Merging',
        arabicTitle: 'إدغام الحرفين المتماثلين',
        description:
          'This rule applies when two identical letters follow one another. The first letter is Saakin (ْ) and the second letter carries a Shaddah (ّ). When recited, the Saakin letter is assimilated into the following letter.',
        examples: [
          { id: 'mith-1', surah: 2, ayah: 16, text: 'رَبِحَت تِّجَارَتُهُمْ', ruleTarget: 'ت + ت' },
          { id: 'mith-2', surah: 5, ayah: 61, text: 'وَقَد دَّخَلُوا', ruleTarget: 'د + د' },
          { id: 'mith-3', surah: 21, ayah: 87, text: 'إِذ ذَّهَبَ مُغَاضِبًا', ruleTarget: 'ذ + ذ' },
          { id: 'mith-4', surah: 4, ayah: 78, text: 'يُدْرِككُّم', ruleTarget: 'ك + ك' },
          { id: 'mith-5', surah: 18, ayah: 78, text: 'مَا اسْتَطَعْتَّ', ruleTarget: 'ت + ت' },
          { id: 'mith-6', surah: 8, ayah: 72, text: 'إِذَا قُمْتُّمْ', ruleTarget: 'ت + ت' },
        ],
      },
    ],
  },
  {
    id: 'idghaam-mutaqaaribayn',
    chapterNumber: 12,
    title: 'Idghaam Mutaqaaribayn (Similar Origin)',
    arabicTitle: 'إدغام المتقاربين',
    category: 'rules_letters',
    summary: 'Assimilation occurring between letters sharing close points of articulation.',
    subChapters: [
      {
        id: 'mutaqaaribayn-rules',
        title: 'Similar Articulation Merging',
        arabicTitle: 'تقارب مخارج الحروف',
        description:
          'Applies when a letter in a word is Saakin (ْ) and the following letter carries a Shaddah (ّ) or is pronounced very close to the same place of articulation as the Saakin letter.',
        examples: [
          { id: 'mut-1', surah: 77, ayah: 20, text: 'نَخْلُقكُّم مِّن مَّاءٍ مَّهِينٍ', ruleTarget: 'ق $\\rightarrow$ ك' },
          { id: 'mut-2', surah: 11, ayah: 42, text: 'ارْكَب مَّعَنَا وَلَا', ruleTarget: 'ب $\\rightarrow$ م' },
          { id: 'mut-3', surah: 17, ayah: 80, text: 'وَقُل رَّبِّ أَدْخِلْنِي مُدْخَلَ', ruleTarget: 'ل $\\rightarrow$ ر' },
          { id: 'mut-4', surah: 20, ayah: 49, text: 'فَمَن رَّبُّكُمَا يَا مُوسَىٰ', ruleTarget: 'ن $\\rightarrow$ ر' },
        ],
      },
    ],
  },
  {
    id: 'raa-rules',
    chapterNumber: 13,
    title: 'The Letter Raa (أحكام الراء)',
    arabicTitle: 'تفخيم وترقيق حرف الراء',
    category: 'rules_letters',
    summary: 'Comprehensive 8 cases governing full mouth (Tafkheem) vs thin mouth (Tarqeeq) for the letter Raa.',
    subChapters: [
      {
        id: 'raa-c1',
        title: '1. Raa with Fathah (َ) or Dhammah (ُ)',
        arabicTitle: 'الراء المفتوحة والمضمومة',
        description: 'A Raa (ر) carrying a Fathah or Dhammah is pronounced with a full (heavy) mouth.',
        examples: [
          { id: 'raa-1a', surah: 2, ayah: 16, text: 'فَمَا رَبِحَت تِّجَارَتُهُمْ', ruleTarget: 'رَ' },
          { id: 'raa-1b', surah: 2, ayah: 28, text: 'تَكْفُرُونَ بِاللَّهِ وَكُنتُمْ', ruleTarget: 'رُ' },
        ],
      },
      {
        id: 'raa-c2',
        title: '2. Raa with Kasrah (ِ)',
        arabicTitle: 'الراء المكسورة',
        description: 'A Raa (ر) carrying a Kasrah is pronounced with a thin (light) mouth.',
        examples: [
          { id: 'raa-2a', surah: 2, ayah: 54, text: 'لَكُمْ عِندَ بَارِئِكُمْ', ruleTarget: 'رِ' },
          { id: 'raa-2b', surah: 2, ayah: 75, text: 'كَلَامَ اللَّهِ ثُمَّ يُحَرِّفُونَهُ', ruleTarget: 'رِ' },
        ],
      },
      {
        id: 'raa-c3',
        title: '3. Raa Saakin preceded by Fathah or Dhammah',
        arabicTitle: 'الراء الساكنة بعد فتح أو ضم',
        description: 'When a Fathah or Dhammah comes before a Raa Saakin (رْ), it is pronounced with a full (heavy) mouth.',
        examples: [
          { id: 'raa-3a', surah: 2, ayah: 7, text: 'أَبْصَارِهِمْ وَعَلَىٰ', ruleTarget: 'رْ preceded by Fathah' },
          { id: 'raa-3b', surah: 2, ayah: 252, text: 'وَإِنَّكَ لَمِنَ الْمُرْسَلِينَ', ruleTarget: 'رْ preceded by Dhammah' },
        ],
      },
      {
        id: 'raa-c4',
        title: '4. Raa Saakin preceded by Kasrah',
        arabicTitle: 'الراء الساكنة بعد كسر',
        description: 'If a Kasrah comes before a Raa Saakin (رْ), it is pronounced with a thin (light) mouth.',
        examples: [
          { id: 'raa-4a', surah: 2, ayah: 6, text: 'تُنذِرْهُمْ لَا يُؤْمِنُونَ', ruleTarget: 'رْ preceded by Kasrah' },
        ],
      },
      {
        id: 'raa-c5',
        title: '5. Raa Shaddah (رّ) carrying Fathah or Dhammah',
        arabicTitle: 'الراء المشددة بالفتح أو الضم',
        description: 'If a Shaddah appears on Raa carrying Fathah or Dhammah, it is pronounced with a full (heavy) mouth.',
        examples: [
          { id: 'raa-5a', surah: 2, ayah: 177, text: 'لَيْسَ الْبِرَّ أَن تُوَلُّوا وُجُوهَكُمْ قِبَلَ', ruleTarget: 'رَّ' },
          { id: 'raa-5b', surah: 18, ayah: 36, text: 'قَائِمَةً وَلَئِن رُّدِدتُّ', ruleTarget: 'رُّ' },
        ],
      },
      {
        id: 'raa-c6',
        title: '6. Raa Shaddah (رّ) carrying Kasrah',
        arabicTitle: 'الراء المشددة بالكسر',
        description: 'If a Shaddah appears on Raa carrying a Kasrah, it is pronounced with a thin (light) mouth.',
        examples: [
          { id: 'raa-6a', surah: 113, ayah: 2, text: 'مِن شَرِّ مَا خَلَقَ', ruleTarget: 'رِّ' },
          { id: 'raa-6b', surah: 6, ayah: 97, text: 'بِهَا فِي ظُلُمَاتِ الْبَرِّ وَالْبَحْرِ', ruleTarget: 'رِّ' },
        ],
      },
      {
        id: 'raa-c7',
        title: '7. Raa Mouquf (Stopped) preceded by Yaa Saakin (يْ)',
        arabicTitle: 'الراء الموقوف عليها بعد ياء ساكنة',
        description:
          'When a Yaa Saakin (يْ) appears before a stopped Raa, and the preceding letter has Kasrah, the Raa is recited thin (light).',
        examples: [
          { id: 'raa-7a', surah: 3, ayah: 180, text: 'رَبَّنَا تَعْمَلُونَ خَبِيرٌ', ruleTarget: 'خَبِيرٌ' },
          { id: 'raa-7b', surah: 34, ayah: 12, text: 'نُذِقْهُ مِنْ عَذَابِ السَّعِيرِ', ruleTarget: 'السَّعِيرِ' },
          { id: 'raa-7c', surah: 17, ayah: 1, text: 'إِنَّهُ هُوَ السَّمِيعُ الْبَصِيرُ', ruleTarget: 'الْبَصِيرُ' },
          { id: 'raa-7d', surah: 3, ayah: 184, text: 'وَالزُّبُرِ وَالْكِتَابِ الْمُنِيرِ', ruleTarget: 'الْمُنِيرِ' },
        ],
      },
      {
        id: 'raa-c8',
        title: '8. Raa Mouquf (Stopped) preceded by Saakin (Non-Yaa)',
        arabicTitle: 'الراء الموقوف عليها بعد ساكن غير الياء',
        description:
          'When a letter other than Yaa Saakin precedes a stopped Raa with Sukoon, and the letter before it carries Fathah or Dhammah, the Raa is pronounced full (heavy).',
        examples: [
          { id: 'raa-8a', surah: 103, ayah: 3, text: 'وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ', ruleTarget: 'بِالصَّبْرِ' },
          { id: 'raa-8b', surah: 103, ayah: 2, text: 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ', ruleTarget: 'خُسْرٍ' },
        ],
      },
    ],
  },
  {
    id: 'madd-system',
    chapterNumber: 14,
    title: 'Madd – Elongation System',
    arabicTitle: 'أحكام المد وأنواعه',
    category: 'madd',
    summary: 'The elongation rules: Maddul Asli, Muttasil, Munfasil, Laazim (Huroof Muqatta’at), and Aaridh with exact Harakaat beats.',
    subChapters: [
      {
        id: 'madd-asli',
        title: 'Maddul Asli (Original Madd)',
        arabicTitle: 'المد الأصلي الطبيعي',
        description: 'Short elongation of 2 Harakaat (Qasr). Alif after Fathah, Waw after Dhammah, Yaa after Kasrah.',
        duration: '2 Harakaat (Qasr)',
        ruleLetters: ['ا', 'و', 'ي'],
        examples: [
          { id: 'madd-asli-1', surah: 2, ayah: 71, text: 'قَالَ إِنَّهُ يَقُولُ إِنَّهَا', ruleTarget: 'ا' },
          { id: 'madd-asli-2', surah: 2, ayah: 26, text: 'الَّذِينَ كَفَرُوا فَيَقُولُونَ مَاذَا أَرَادَ اللَّهُ', ruleTarget: 'و' },
          { id: 'madd-asli-3', surah: 2, ayah: 90, text: 'وَلِلْكَافِرِينَ عَذَابٌ مُّهِينٌ', ruleTarget: 'ي' },
        ],
      },
      {
        id: 'madd-muttasil',
        title: 'Maddul Muttasil (The Joined Madd)',
        arabicTitle: 'المد المتصل',
        description: 'When a Madd letter is followed by a Hamzah (ء) in the SAME word. Recited for 4 to 6 Harakaat (approx 4–6 seconds).',
        duration: '4 to 6 Harakaat',
        examples: [
          { id: 'madd-mut-1', surah: 2, ayah: 6, text: 'سَوَاءٌ عَلَيْهِمْ', ruleTarget: 'ا + ء' },
          { id: 'madd-mut-2', surah: 13, ayah: 25, text: 'السُّوءُ الدَّارِ', ruleTarget: 'و + ء' },
          { id: 'madd-mut-3', surah: 89, ayah: 23, text: 'وَجِيءَ يَوْمَئِذٍ', ruleTarget: 'ي + ء' },
        ],
      },
      {
        id: 'madd-munfasil',
        title: 'Maddul Munfasil (The Detached Madd)',
        arabicTitle: 'المد المنفصل',
        description:
          'If a word ends with a Madd letter and the NEXT word begins with a Hamzah (ء). Recited for 3 to 5 Harakaat (approx 3–5 seconds).',
        duration: '3 to 5 Harakaat',
        examples: [
          { id: 'madd-mun-1', surah: 97, ayah: 1, text: 'إِنَّا أَنزَلْنَاهُ', ruleTarget: 'ا ... ء' },
          { id: 'madd-mun-2', surah: 2, ayah: 235, text: 'وَاعْلَمُوا أَنَّ اللَّهَ', ruleTarget: 'و ... ء' },
          { id: 'madd-mun-3', surah: 4, ayah: 135, text: 'قُوا أَنفُسَكُمْ', ruleTarget: 'ي ... ء' },
        ],
      },
      {
        id: 'madd-laazim',
        title: 'Maddul Laazim (Compulsory Madd in Huroof Muqatta’at)',
        arabicTitle: 'المد اللازم في الحروف المقطعة',
        description: 'Compulsory 6 Harakaat elongation when pronouncing disjointed letters (Huroof Muqatta’at) at Surah openings.',
        duration: '6 Harakaat (approx 6 seconds)',
        examples: [
          { id: 'madd-laaz-1', surah: 50, ayah: 1, text: 'ق', ruleTarget: 'ق' },
          { id: 'madd-laaz-2', surah: 45, ayah: 1, text: 'حم', ruleTarget: 'حم' },
          { id: 'madd-laaz-3', surah: 42, ayah: 2, text: 'حم عسق', ruleTarget: 'حم عسق' },
          { id: 'madd-laaz-4', surah: 19, ayah: 1, text: 'كهيعص', ruleTarget: 'كهيعص' },
          { id: 'madd-laaz-5', surah: 68, ayah: 1, text: 'ن', ruleTarget: 'ن' },
          { id: 'madd-laaz-6', surah: 2, ayah: 1, text: 'الم', ruleTarget: 'الم' },
        ],
      },
      {
        id: 'madd-aaridh',
        title: 'Maddul Aaridh (Abrupt Stop Madd)',
        arabicTitle: 'المد العارض للسكون',
        description: 'When a Saakin letter occurs after a Madd letter due to stopping (Waqf). Recited for 2 to 5 Harakaat.',
        duration: '2 to 5 Harakaat',
        examples: [
          { id: 'madd-aar-1', surah: 46, ayah: 32, text: 'جَرْحٌ دُونَهُ أَوْلِيَاءُ', ruleTarget: 'ا' },
          { id: 'madd-aar-2', surah: 67, ayah: 27, text: 'الَّتِي كُنتُم بِهَا تَدَّعُونَ', ruleTarget: 'و' },
          { id: 'madd-aar-3', surah: 19, ayah: 37, text: 'مِنْ مَّشْهَدٍ يَوْمٍ عَظِيمٍ', ruleTarget: 'ي' },
        ],
      },
    ],
  },
  {
    id: 'sun-letters',
    chapterNumber: 15,
    title: 'The Sun Letters (الحروف الشمسية)',
    arabicTitle: 'أحكام الحروف الشمسية',
    category: 'rules_letters',
    summary: 'The 14 Sun Letters where the Laam of the definite article (ال) assimilates with Shaddah.',
    subChapters: [
      {
        id: 'sun-letters-all',
        title: '14 Sun Letters & Assimilation',
        arabicTitle: 'جدول الحروف الشمسية الأربعة عشر',
        description:
          'An indefinite word starting with a Sun Letter, when attached to (ال), results in Laam NOT being pronounced. Alif merges into the Sun Letter carrying a Shaddah (ّ). If preceded by another word/letter, Hamzat al-Wasl is silent.',
        ruleLetters: ['ت', 'ث', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ل', 'ن'],
        examples: [
          { id: 'sun-ta', surah: 95, ayah: 1, text: 'وَالتِّينِ', attachedText: 'التِّينِ', precededText: 'وَالتِّينِ', ruleTarget: 'ت' },
          { id: 'sun-tha', surah: 3, ayah: 195, text: 'حُسْنُ الثَّوَابِ', attachedText: 'الثَّوَابِ', precededText: 'حُسْنُ الثَّوَابِ', ruleTarget: 'ث' },
          { id: 'sun-dal', surah: 1, ayah: 3, text: 'يَوْمِ الدِّينِ', attachedText: 'الدِّينِ', precededText: 'يَوْمِ الدِّينِ', ruleTarget: 'د' },
          { id: 'sun-dhal', surah: 51, ayah: 1, text: 'وَالذَّرِّيَّاتِ', attachedText: 'الذَّرِّيَّاتِ', precededText: 'وَالذَّرِّيَّاتِ', ruleTarget: 'ذ' },
          { id: 'sun-raa', surah: 2, ayah: 143, text: 'وَيَكُونَ الرَّسُولُ', attachedText: 'الرَّسُولُ', precededText: 'وَيَكُونَ الرَّسُولُ', ruleTarget: 'ر' },
          { id: 'sun-za', surah: 2, ayah: 277, text: 'وَآتُوا الزَّكَاةَ', attachedText: 'الزَّكَاةَ', precededText: 'وَآتُوا الزَّكَاةَ', ruleTarget: 'ز' },
          { id: 'sun-sin', surah: 2, ayah: 22, text: 'مِنَ السَّمَاءِ', attachedText: 'السَّمَاءِ', precededText: 'مِنَ السَّمَاءِ', ruleTarget: 'س' },
          { id: 'sun-shin', surah: 25, ayah: 29, text: 'وَكَانَ الشَّيْطَانُ', attachedText: 'الشَّيْطَانُ', precededText: 'وَكَانَ الشَّيْطَانُ', ruleTarget: 'ش' },
          { id: 'sun-sad', surah: 112, ayah: 2, text: 'اللَّهُ الصَّمَدُ', attachedText: 'الصَّمَدُ', precededText: 'اللَّهُ الصَّمَدُ', ruleTarget: 'ص' },
          { id: 'sun-dhad', surah: 9, ayah: 91, text: 'عَلَى الضُّعَفَاءِ', attachedText: 'الضُّعَفَاءِ', precededText: 'عَلَى الضُّعَفَاءِ', ruleTarget: 'ض' },
          { id: 'sun-tah', surah: 2, ayah: 260, text: 'مِنَ الطَّيْرِ', attachedText: 'الطَّيْرِ', precededText: 'مِنَ الطَّيْرِ', ruleTarget: 'ط' },
          { id: 'sun-zhah', surah: 4, ayah: 75, text: 'هَذِهِ الْقَرْيَةِ الظَّالِمِ', attachedText: 'الظَّالِمِ', precededText: 'هَذِهِ الْقَرْيَةِ الظَّالِمِ', ruleTarget: 'ظ' },
          { id: 'sun-laam', surah: 2, ayah: 274, text: 'بِاللَّيْلِ', attachedText: 'اللَّيْلِ', precededText: 'بِاللَّيْلِ', ruleTarget: 'ل' },
          { id: 'sun-noon', surah: 75, ayah: 2, text: 'لَا النَّفْسِ', attachedText: 'النَّفْسِ', precededText: 'لَا النَّفْسِ', ruleTarget: 'ن' },
        ],
      },
    ],
  },
  {
    id: 'moon-letters',
    chapterNumber: 16,
    title: 'The Moon Letters (الحروف القمرية)',
    arabicTitle: 'أحكام الحروف القمرية',
    category: 'rules_letters',
    summary: 'The 14 Moon Letters where the Laam of the definite article (ال) is pronounced clearly as Laam Saakin (لْ).',
    subChapters: [
      {
        id: 'moon-letters-all',
        title: '14 Moon Letters & Clear Laam',
        arabicTitle: 'جدول الحروف القمرية الأربعة عشر',
        description:
          'When (ال) is attached to a Moon Letter, the Laam is pronounced clearly as Laam Saakin (لْ). Alif is Hamzatul Wasl (silent when preceded by a word).',
        ruleLetters: ['ا', 'ب', 'ج', 'ح', 'خ', 'ع', 'غ', 'ف', 'ق', 'ك', 'م', 'هـ', 'و', 'ي'],
        examples: [
          { id: 'moon-alif', surah: 12, ayah: 6, text: 'تَأْوِيلِ الْأَحَادِيثِ', attachedText: 'الْأَحَادِيثِ', precededText: 'تَأْوِيلِ الْأَحَادِيثِ', ruleTarget: 'ا' },
          { id: 'moon-ba', surah: 2, ayah: 127, text: 'مِنَ الْبَيْتِ', attachedText: 'الْبَيْتِ', precededText: 'مِنَ الْبَيْتِ', ruleTarget: 'ب' },
          { id: 'moon-jim', surah: 7, ayah: 40, text: 'بَلَغَ الْجَبَلَ', attachedText: 'الْجَبَلَ', precededText: 'بَلَغَ الْجَبَلَ', ruleTarget: 'ج' },
          { id: 'moon-ha', surah: 69, ayah: 2, text: 'مَا الْحَاقَّةُ', attachedText: 'الْحَاقَّةُ', precededText: 'مَا الْحَاقَّةُ', ruleTarget: 'ح' },
          { id: 'moon-khaa', surah: 52, ayah: 35, text: 'أَمْ هُمُ الْخَالِقُونَ', attachedText: 'الْخَالِقُونَ', precededText: 'أَمْ هُمُ الْخَالِقُونَ', ruleTarget: 'خ' },
          { id: 'moon-ayn', surah: 10, ayah: 88, text: 'يَرَوُا الْعَذَابَ', attachedText: 'الْعَذَابَ', precededText: 'يَرَوُا الْعَذَابَ', ruleTarget: 'ع' },
          { id: 'moon-ghayn', surah: 10, ayah: 90, text: 'أَدْرَكَهُ الْغَرَقُ', attachedText: 'الْغَرَقُ', precededText: 'أَدْرَكَهُ الْغَرَقُ', ruleTarget: 'غ' },
          { id: 'moon-fa', surah: 2, ayah: 191, text: 'وَالْفِتْنَةُ', attachedText: 'الْفِتْنَةُ', precededText: 'وَالْفِتْنَةُ', ruleTarget: 'ف' },
          { id: 'moon-qaf', surah: 16, ayah: 107, text: 'لَا يَهْدِي الْقَوْمَ', attachedText: 'الْقَوْمَ', precededText: 'لَا يَهْدِي الْقَوْمَ', ruleTarget: 'ق' },
          { id: 'moon-kaf', surah: 18, ayah: 9, text: 'أَصْحَابُ الْكَهْفِ', attachedText: 'الْكَهْفِ', precededText: 'أَصْحَابُ الْكَهْفِ', ruleTarget: 'ك' },
          { id: 'moon-meem', surah: 1, ayah: 7, text: 'غَيْرِ الْمَغْضُوبِ', attachedText: 'الْمَغْضُوبِ', precededText: 'غَيْرِ الْمَغْضُوبِ', ruleTarget: 'م' },
          { id: 'moon-waw', surah: 56, ayah: 1, text: 'وَقَعَتِ الْوَاقِعَةُ', attachedText: 'الْوَاقِعَةُ', precededText: 'وَقَعَتِ الْوَاقِعَةُ', ruleTarget: 'و' },
          { id: 'moon-haa', surah: 56, ayah: 55, text: 'شُرْبَ الْهِيمِ', attachedText: 'الْهِيمِ', precededText: 'شُرْبَ الْهِيمِ', ruleTarget: 'هـ' },
          { id: 'moon-yaa', surah: 15, ayah: 99, text: 'يَأْتِيَكَ الْيَقِينُ', attachedText: 'الْيَقِينُ', precededText: 'يَأْتِيَكَ الْيَقِينُ', ruleTarget: 'ي' },
        ],
      },
    ],
  },
  {
    id: 'waqf-rules',
    chapterNumber: 17,
    title: 'The Rules of Stopping (Waqf)',
    arabicTitle: 'أحكام الوقف',
    category: 'waqf_sajdah',
    summary: 'How short vowels, Tanween, and Madd transform into Saakin or single Fathah when pausing.',
    subChapters: [
      {
        id: 'waqf-vowels-saakin',
        title: 'Short Vowels transform to Saakin (ْ)',
        arabicTitle: 'تحويل الحركات إلى السكون',
        description:
          'If any sign (ـُ / ـِ / ـٌ / ـٍ) appears on the last letter of a word when a stop is required, the last letter is read as SAAKIN (ْ).',
        urduNote: 'اگر اعراب میں سے کوئی نشان (ـُ / ـِ / ـٌ / ـٍ) کسی لفظ کے آخری حرف پر ہو اور وہاں ٹھہرنا ضروری ہو تو آخری حرف ساکن ہوگا۔',
        examples: [
          { id: 'wq-v1', surah: 88, ayah: 1, text: 'هَلْ أَتَىٰكَ حَدِيثُ الْغَاشِيَةِ', ruleTarget: 'الْغَاشِيَةِ $\\rightarrow$ الْغَاشِيَهْ' },
          { id: 'wq-v2', surah: 7, ayah: 24, text: 'إِلَىٰ حِينٍ', ruleTarget: 'حِينٍ $\\rightarrow$ حِينْ' },
          { id: 'wq-v3', surah: 15, ayah: 6, text: 'إِنَّكَ لَمَجْنُونٌ', ruleTarget: 'لَمَجْنُونٌ $\\rightarrow$ لَمَجْنُونْ' },
          { id: 'wq-v4', surah: 15, ayah: 8, text: 'إِذًا مُنظَرِينَ', ruleTarget: 'مُنظَرِينَ $\\rightarrow$ مُنظَرِينْ' },
          { id: 'wq-v5', surah: 88, ayah: 4, text: 'نَارًا حَامِيَةً', ruleTarget: 'حَامِيَةً $\\rightarrow$ حَامِيَهْ' },
          { id: 'wq-v6', surah: 89, ayah: 27, text: 'يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ', ruleTarget: 'الْمُطْمَئِنَّةُ $\\rightarrow$ الْمُطْمَئِنَّهْ' },
        ],
      },
      {
        id: 'waqf-fathatain-madd',
        title: 'Fathatain (ً) & Madd transform to Fathah (َ)',
        arabicTitle: 'تحويل التنوين بالفتح إلى الفتحة',
        description:
          'However, if the last letter carries Fathatain (ً) or Madd, the last letter is read as if it has a single Fathah (َ) on it.',
        urduNote: 'تاہم اگر آخری حرف پر دوزبر (ً) ہو یا مد ہو تو آخری حرف اس طرح پڑھا جائے گا جیسے اس پر ایک زبر (َ) ہو۔',
        examples: [
          { id: 'wq-f1', surah: 78, ayah: 28, text: 'يَا لَيْتَنِي كُنتُ تُرَابًا', ruleTarget: 'تُرَابًا $\\rightarrow$ تُرَابَا' },
          { id: 'wq-f2', surah: 79, ayah: 19, text: 'رَبِّكَ فَتَخْشَىٰ', ruleTarget: 'فَتَخْشَىٰ' },
          { id: 'wq-f3', surah: 79, ayah: 2, text: 'وَالنَّاشِطَاتِ نَشْطًا', ruleTarget: 'نَشْطًا $\\rightarrow$ نَشْطَا' },
          { id: 'wq-f4', surah: 92, ayah: 16, text: 'كَذَّبَ وَتَوَلَّىٰ', ruleTarget: 'وَتَوَلَّىٰ' },
          { id: 'wq-f5', surah: 89, ayah: 20, text: 'وَتُحِبُّونَ الْمَالَ حُبًّا جَمًّا', ruleTarget: 'جَمًّا $\\rightarrow$ جَمَّا' },
          { id: 'wq-f6', surah: 91, ayah: 1, text: 'وَالشَّمْسِ وَضُحَاهَا', ruleTarget: 'وَضُحَاهَا' },
        ],
      },
    ],
  },
  {
    id: 'pause-symbols',
    chapterNumber: 18,
    title: 'Symbols Denoting Pauses',
    arabicTitle: 'علامات الوقف في المصحف',
    category: 'waqf_sajdah',
    summary: 'The complete set of Quranic stop & continuation symbols (م, ط, سكتة, لا, صلى, قف, ج, ؞).',
    subChapters: [
      {
        id: 'symbols-catalog',
        title: 'Pause Symbol Reference',
        arabicTitle: 'رموز الوقف ومعانيها',
        description: 'Official meaning and Quranic examples for every pause symbol found in the Mus-haf.',
        examples: [
          { id: 'sym-m', surah: 19, ayah: 16, text: 'وَاذْكُرْ فِي الْكِتَابِ مَرْيَمَ إِذِ انْتَبَذَتْ', ruleTarget: 'م (Compulsory Stop)', ruleType: 'Stop is compulsory here.' },
          { id: 'sym-tah', surah: 18, ayah: 8, text: 'عَلَيْهَا صَعِيدًا جُرُزًا', ruleTarget: 'ط (Necessary Stop)', ruleType: 'It is better to stop here.' },
          { id: 'sym-waqfah', surah: 2, ayah: 260, text: 'فَانْظُرْ إِلَى الْعِظَامِ كَيْفَ نُنْشِزُهَا ثُمَّ اكْسُهَا لَحْمًا', ruleTarget: 'وقفہ (Short Pause)', ruleType: 'Pause vocal sound briefly without breathing.' },
          { id: 'sym-saktah', surah: 83, ayah: 14, text: 'كَلَّا بَلْ ۜ رَانَ عَلَىٰ قُلُوبِهِمْ', ruleTarget: 'سكتة (Saktah)', ruleType: 'Pause sound for a moment without taking breath.' },
          { id: 'sym-laa', surah: 20, ayah: 14, text: 'أَقِمِ الصَّلَاةَ لِذِكْرِي', ruleTarget: 'لا (Do Not Pause)', ruleType: 'Necessary to continue; do not pause.' },
          { id: 'sym-za', surah: 18, ayah: 24, text: 'إِلَّا أَن يَشَاءَ اللَّهُ وَاذْكُر رَّبَّكَ', ruleTarget: 'ز (Desirable to continue)', ruleType: 'Desirable to continue, do not pause.' },
          { id: 'sym-sad', surah: 19, ayah: 17, text: 'فَأَرْسَلْنَا إِلَيْهَا رُوحَنَا', ruleTarget: 'ص (Desirable to continue)', ruleType: 'Desirable to continue, do not pause.' },
          { id: 'sym-qaf', surah: 18, ayah: '4–5', text: 'قَالُوا اتَّخَذَ اللَّهُ وَلَدًا ۝ مَّا لَهُم بِهِ', ruleTarget: 'ق (Desirable to continue)', ruleType: 'Desirable to continue, do not pause.' },
          { id: 'sym-salla', surah: 18, ayah: '13–14', text: 'وَزِدْنَاهُمْ هُدًى وَرَبَطْنَا', ruleTarget: 'صلى (Desirable to continue)', ruleType: 'Better to continue.' },
          { id: 'sym-qif', surah: 2, ayah: 285, text: 'وَمَلَائِكَتِهِ وَرُسُلِهِ ۚ لَا نُفَرِّقُ', ruleTarget: 'قف (Recommended pause)', ruleType: 'Recommended pause.' },
          { id: 'sym-jim', surah: 18, ayah: 27, text: 'رَبِّكَ لَا مُبَدِّلَ لِكَلِمَاتِهِ', ruleTarget: 'ج (Optional Pause)', ruleType: 'Optional to pause or to continue.' },
          { id: 'sym-muanaqah', surah: 25, ayah: 32, text: 'وَقَالَ الَّذِينَ كَفَرُوا لَوْلَا نُزِّلَ عَلَيْهِ الْقُرْآنُ جُمْلَةً وَاحِدَةً ۚ كَذَٰلِكَ لِنُثَبِّتَ بِهِ فُؤَادَكَ وَرَتَّلْنَاهُ تَرْتِيلًا', ruleTarget: '؞ (Embrace Pause)', ruleType: 'Any two of the three verses may be read in continuity.' },
        ],
      },
    ],
  },
  {
    id: 'sajdah-verses',
    chapterNumber: 19,
    title: 'The 14 Prostration Verses (Sajdah Tilawat)',
    arabicTitle: 'سجدات التلاوة الأربعة عشر في القرآن',
    category: 'waqf_sajdah',
    summary: 'The complete table of the 14 verses of Sajdah Tilawat across the Holy Quran.',
    subChapters: [
      {
        id: 'sajdah-catalog',
        title: 'The 14 Quranic Prostration Verses',
        arabicTitle: 'جدول مواضع سجدات التلاوة',
        description: 'Prostration (Sajdah) is to be performed when reciting or hearing any of the following 14 verses.',
        examples: [
          { id: 'sajda-1', sajdaNo: 1, page: 247, surah: 7, ayah: 206, text: 'وَيُسَبِّحُونَهُ وَلَهُ يَسْجُدُونَ', ruleTarget: 'Sajdah 1' },
          { id: 'sajda-2', sajdaNo: 2, page: 351, surah: 13, ayah: 15, text: 'وَلِلَّهِ يَسْجُدُ مَن فِي السَّمَاوَاتِ وَالْأَرْضِ', ruleTarget: 'Sajdah 2' },
          { id: 'sajda-3', sajdaNo: 3, page: 381, surah: 16, ayah: 50, text: 'يَخَافُونَ رَبَّهُم مِّن فَوْقِهِمْ وَيَفْعَلُونَ مَا يُؤْمَرُونَ', ruleTarget: 'Sajdah 3' },
          { id: 'sajda-4', sajdaNo: 4, page: 410, surah: 17, ayah: 109, text: 'لِلْأَذْقَانِ يَبْكُونَ وَيَزِيدُهُمْ خُشُوعًا', ruleTarget: 'Sajdah 4' },
          { id: 'sajda-5', sajdaNo: 5, page: 433, surah: 19, ayah: 58, text: 'إِذَا تُتْلَىٰ عَلَيْهِمْ آيَاتُ الرَّحْمَٰنِ خَرُّوا سُجَّدًا وَبُكِيًّا', ruleTarget: 'Sajdah 5' },
          { id: 'sajda-6', sajdaNo: 6, page: 467, surah: 22, ayah: 18, text: 'أَلَمْ تَرَ أَنَّ اللَّهَ يَسْجُدُ لَهُ', ruleTarget: 'Sajdah 6' },
          { id: 'sajda-7', sajdaNo: 7, page: 511, surah: 25, ayah: 60, text: 'وَإِذَا قِيلَ لَهُمُ اسْجُدُوا لِلرَّحْمَٰنِ قَالُوا', ruleTarget: 'Sajdah 7' },
          { id: 'sajda-8', sajdaNo: 8, page: 530, surah: 27, ayah: 26, text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', ruleTarget: 'Sajdah 8' },
          { id: 'sajda-9', sajdaNo: 9, page: 581, surah: 32, ayah: 15, text: 'خَرُّوا سُجَّدًا وَسَبَّحُوا بِحَمْدِ رَبِّهِمْ', ruleTarget: 'Sajdah 9' },
          { id: 'sajda-10', sajdaNo: 10, page: 632, surah: 38, ayah: 24, text: 'وَخَرَّ رَاكِعًا وَأَنَابَ', ruleTarget: 'Sajdah 10' },
          { id: 'sajda-11', sajdaNo: 11, page: 667, surah: 41, ayah: 38, text: 'يُسَبِّحُونَ لَهُ بِاللَّيْلِ وَالنَّهَارِ وَهُمْ لَا يَسْأَمُونَ', ruleTarget: 'Sajdah 11' },
          { id: 'sajda-12', sajdaNo: 12, page: 738, surah: 53, ayah: 62, text: 'فَاسْجُدُوا لِلَّهِ وَاعْبُدُوا', ruleTarget: 'Sajdah 12' },
          { id: 'sajda-13', sajdaNo: 13, page: 831, surah: 84, ayah: 21, text: 'وَإِذَا قُرِئَ عَلَيْهِمُ الْقُرْآنُ لَا يَسْجُدُونَ', ruleTarget: 'Sajdah 13' },
          { id: 'sajda-14', sajdaNo: 14, page: 842, surah: 96, ayah: 19, text: 'كَلَّا لَا تُطِعْهُ وَاسْجُدْ وَاقْتَرِبْ', ruleTarget: 'Sajdah 14' },
        ],
      },
    ],
  },
];

/** Helper to retrieve all Quranic practice extracts across INFO.md */
export function getAllInfoExtracts(): QuranExtract[] {
  const extracts: QuranExtract[] = [];
  for (const chapter of TAJWEED_INFO_CHAPTERS) {
    for (const sub of chapter.subChapters) {
      if (sub.examples) {
        extracts.push(...sub.examples);
      }
    }
  }
  return extracts;
}
