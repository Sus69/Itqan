/**
 * Practice verses for the Tajweed Studio.
 * `surah` / `ayah` are display metadata; `text` is the exact string
 * sent to POST /api/v1/tajweed/analyze as the `text` form field.
 * Each verse includes ALL applicable Tajweed rules for authentic AI evaluation.
 */
export interface PracticeVerse {
  id: string;
  surah: string;
  ayah: string;
  arabicName: string;
  text: string;
  focusRules: string[]; // human-readable rule tags covering all applicable rules
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export const VERSES: PracticeVerse[] = [
  {
    id: 'fatiha-1',
    surah: 'Al-Fātiḥah',
    ayah: '1:1',
    arabicName: 'الفاتحة',
    text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    focusRules: ['Laam of Allah (Tarqeeq / Light)', 'Sun Letters (الرَّحْمَٰنِ)', 'Sun Letters (الرَّحِيمِ)', 'Maddul Aaridh (Stop)'],
    difficulty: 'Beginner',
  },
  {
    id: 'fatiha-2-4',
    surah: 'Al-Fātiḥah',
    ayah: '1:2-4',
    arabicName: 'الفاتحة',
    text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ',
    focusRules: [
      'Laam of Allah (Tarqeeq)',
      'Moon Letters (الْعَالَمِينَ)',
      'Sun Letters (الرَّحْمَٰنِ, الدِّينِ)',
      'Maddul Asli (2 Beats)',
      'Maddul Aaridh (Stop)',
    ],
    difficulty: 'Beginner',
  },
  {
    id: 'fatiha-7',
    surah: 'Al-Fātiḥah',
    ayah: '1:7',
    arabicName: 'الفاتحة',
    text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    focusRules: [
      'Ithaar (أَنْعَمْتَ)',
      'Ithaar Shafawi (عَلَيْهِمْ + غ/و)',
      'Maddul Laazim (الضَّالِّينَ 6 Beats)',
      'Sun Letters (الَّذِينَ, الضَّالِّينَ)',
      'Moon Letters (الْمَغْضُوبِ)',
      'Raa Tafkheem (Heavy Raa)',
    ],
    difficulty: 'Advanced',
  },
  {
    id: 'kursi-opening',
    surah: 'Ayat Al-Kursi (Al-Baqarah)',
    ayah: '2:255',
    arabicName: 'آية الكرسي',
    text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    focusRules: [
      'Laam of Allah (Tafkheem / Heavy)',
      'Maddul Asli (2 Beats)',
      'Moon Letters (الْحَيُّ)',
      'Moon Letters (الْقَيُّومُ)',
      'Maddul Aaridh (Stop)',
    ],
    difficulty: 'Beginner',
  },
  {
    id: 'kursi-middle',
    surah: 'Ayat Al-Kursi (Al-Baqarah)',
    ayah: '2:255',
    arabicName: 'آية الكرسي',
    text: 'لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ',
    focusRules: [
      'Idghaam with Ghunnah (سِنَةٌ + و)',
      'Idghaam without Ghunnah (نَوْمٌ + لَّهُ)',
      'Sun Letters (السَّمَاوَاتِ)',
      'Moon Letters (الْأَرْضِ)',
      'Raa Tafkheem (Heavy Raa)',
      'Maddul Asli',
    ],
    difficulty: 'Intermediate',
  },
  {
    id: 'baqarah-256',
    surah: 'Al-Baqarah',
    ayah: '2:256',
    arabicName: 'البقرة',
    text: 'لَا إِكْرَاهَ فِي الدِّينِ ۖ قَد تَّبَيَّنَ الرُّشْدُ مِنَ الْغَيِّ',
    focusRules: [
      'Sun Letters (الدِّينِ, الرُّشْدُ)',
      'Idghaam Mutaqaaribayn (قَد + تَّبَيَّنَ)',
      'Raa Tafkheem (الرُّشْدُ)',
      'Moon Letters (الْغَيِّ)',
      'Maddul Asli',
    ],
    difficulty: 'Advanced',
  },
  {
    id: 'baqarah-286',
    surah: 'Al-Baqarah',
    ayah: '2:286',
    arabicName: 'البقرة',
    text: 'رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا',
    focusRules: [
      'Raa Tafkheem (رَبَّنَا, وَارْحَمْنَا)',
      'Noon Mushaddadah (Ghunnah 2 Beats)',
      'Maddul Asli',
      'Raa Tarqeeq (وَاغْفِرْ Light Raa)',
      'Qalqala (ط)',
    ],
    difficulty: 'Intermediate',
  },
  {
    id: 'yasin-1-2',
    surah: 'Yā-Sīn',
    ayah: '36:1-2',
    arabicName: 'يس',
    text: 'يس ۝ وَالْقُرْآنِ الْحَكِيمِ',
    focusRules: [
      'Maddul Laazim (Huroof Muqatta\'at 6 Beats)',
      'Moon Letters (الْقُرْآنِ)',
      'Raa Tafkheem',
      'Moon Letters (الْحَكِيمِ)',
      'Maddul Aaridh',
    ],
    difficulty: 'Intermediate',
  },
  {
    id: 'rahman-1-4',
    surah: 'Ar-Raḥmān',
    ayah: '55:1-4',
    arabicName: 'الرحمن',
    text: 'الرَّحْمَٰنُ ۝ عَلَّمَ الْقُرْآنَ ۝ خَلَقَ الْإِنسَانَ ۝ عَلَّمَهُ الْبَيَانَ',
    focusRules: [
      'Sun Letters (الرَّحْمَٰنُ)',
      'Moon Letters (الْقُرْآنَ, الْبَيَانَ)',
      'Ikhfa (الْإِنسَانَ)',
      'Qalqala (خَلَقَ)',
      'Maddul Aaridh (Stop)',
    ],
    difficulty: 'Beginner',
  },
  {
    id: 'mulk-1',
    surah: 'Al-Mulk',
    ayah: '67:1',
    arabicName: 'الملك',
    text: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    focusRules: [
      'Raa Tafkheem (تَبَارَكَ, قَدِيرٌ)',
      'Moon Letters (الْمُلْكُ)',
      'Ikhfa (شَيْءٍ + ق)',
      'Qalqala (قَدِيرٌ)',
      'Maddul Aaridh',
    ],
    difficulty: 'Intermediate',
  },
  {
    id: 'kahf-1',
    surah: 'Al-Kahf',
    ayah: '18:1',
    arabicName: 'الكهف',
    text: 'الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا',
    focusRules: [
      'Moon Letters (الْحَمْدُ, الْكِتَابَ)',
      'Laam of Allah (Tarqeeq / Light)',
      'Ikhfa (أَنزَلَ)',
      'Qalqala (عَبْدِهِ)',
      'Ithaar Shafawi (لَمْ + يَ)',
      'Idghaam without Ghunnah (يَجْعَل + لَّهُ)',
    ],
    difficulty: 'Advanced',
  },
  {
    id: 'falaq-full',
    surah: 'Al-Falaq',
    ayah: '113:1-5',
    arabicName: 'الفلق',
    text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
    focusRules: [
      'Qalqala Mouquf (الْفَلَقِ, خَلَقَ, وَقَبَ, الْعُقَدِ, حَسَدَ)',
      'Ikhfa (مِن شَرِّ)',
      'Ithaar (غَاسِقٍ + إِذَا, حَاسِدٍ + إِذَا)',
      'Sun Letters (النَّفَّاثَاتِ)',
      'Ghunnah Mushaddadah (نّ)',
      'Moon Letters (الْفَلَقِ, الْعُقَدِ)',
    ],
    difficulty: 'Intermediate',
  },
  {
    id: 'nas-full',
    surah: 'An-Nās',
    ayah: '114:1-3',
    arabicName: 'الناس',
    text: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ',
    focusRules: [
      'Sun Letters (النَّاسِ)',
      'Noon Mushaddadah (Ghunnah 2 Beats)',
      'Maddul Asli',
      'Raa Tafkheem (بِرَبِّ)',
    ],
    difficulty: 'Beginner',
  },
  {
    id: 'ikhlas-full',
    surah: 'Al-Ikhlāṣ',
    ayah: '112:1-4',
    arabicName: 'الإخلاص',
    text: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
    focusRules: [
      'Qalqala (أَحَدٌ, الصَّمَدُ, يَلِدْ, يُولَدْ)',
      'Laam of Allah (Tafkheem / Heavy)',
      'Ithaar Shafawi (لَمْ + ي)',
      'Idghaam without Ghunnah (يَكُن + لَّهُ)',
      'Ithaar (كُفُوًا + أ)',
      'Sun Letters (الصَّمَدُ)',
    ],
    difficulty: 'Beginner',
  },
  {
    id: 'kafirun-1-3',
    surah: 'Al-Kāfirūn',
    ayah: '109:1-3',
    arabicName: 'الكافرون',
    text: 'قُلْ يَا أَيُّهَا الْكَافِرُونَ ۝ لَا أَعْبُدُ مَا تَعْبُدُونَ ۝ وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ',
    focusRules: [
      'Maddul Munfasil (3-5 Beats)',
      'Raa Tafkheem (الْكَافِرُونَ)',
      'Ikhfa (أَنتُمْ)',
      'Ithaar Shafawi (أَنتُمْ + ع)',
      'Qalqala (أَعْبُدُ)',
      'Moon Letters (الْكَافِرُونَ)',
    ],
    difficulty: 'Intermediate',
  },
  {
    id: 'qadr-1-3',
    surah: 'Al-Qadr',
    ayah: '97:1-3',
    arabicName: 'القدر',
    text: 'إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ ۝ وَمَا أَدْرَاكَ مَا لَيْلَةُ الْقَدْرِ ۝ لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ',
    focusRules: [
      'Noon Mushaddadah (Ghunnah 2 Beats)',
      'Maddul Munfasil',
      'Ikhfa (أَنزَلْنَاهُ)',
      'Qalqala (الْقَدْرِ)',
      'Idghaam with Ghunnah (خَيْرٌ + مِّنْ)',
      'Ithaar (مِّنْ + أ)',
      'Moon Letters (الْقَدْرِ)',
    ],
    difficulty: 'Advanced',
  },
  {
    id: 'nasr-full',
    surah: 'An-Naṣr',
    ayah: '110:1-3',
    arabicName: 'النصر',
    text: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ ۝ وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا ۝ فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ ۚ إِنَّهُ كَانَ تَوَّابًا',
    focusRules: [
      'Maddul Muttasil (جَاءَ 4-5 Beats)',
      'Laam of Allah (Tafkheem in نَصْرُ اللَّهِ & Tarqeeq in دِينِ اللَّهِ)',
      'Noon Mushaddadah (النَّاسَ)',
      'Qalqala (يَدْخُلُونَ)',
      'Raa Tarqeeq (وَاسْتَغْفِرْهُ Light Raa)',
      'Moon Letters (وَالْفَتْحُ)',
    ],
    difficulty: 'Intermediate',
  },
  {
    id: 'asr-full',
    surah: 'Al-ʿAṣr',
    ayah: '103:1-3',
    arabicName: 'العصر',
    text: 'وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ۝ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ',
    focusRules: [
      'Raa Tafkheem (وَالْعَصْرِ, خُسْرٍ)',
      'Noon Mushaddadah (إِنَّ)',
      'Ikhfa (الْإِنسَانَ)',
      'Sun Letters (الصَّالِحَاتِ)',
      'Moon Letters (وَالْعَصْرِ, الْإِنسَانَ)',
      'Qalqala Mouquf (بِالْحَقِّ, بِالصَّبْرِ)',
    ],
    difficulty: 'Intermediate',
  },
  {
    id: 'alaq-1-5',
    surah: 'Al-ʿAlaq',
    ayah: '96:1-5',
    arabicName: 'العلق',
    text: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ ۝ خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ ۝ اقْرَأْ وَرَبُّكَ الْأَكْرَمُ ۝ الَّذِي عَلَّمَ بِالْقَلَمِ ۝ عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ',
    focusRules: [
      'Qalqala (اقْرَأْ, خَلَقَ)',
      'Ikhfa (الْإِنسَانَ)',
      'Ithaar (عَلَقٍ + ۝)',
      'Moon Letters (الْأَكْرَمُ, بِالْقَلَمِ)',
      'Ithaar Shafawi (لَمْ + ي)',
      'Raa Tafkheem (اقْرَأْ, رَبِّكَ)',
    ],
    difficulty: 'Intermediate',
  },
  {
    id: 'qariah-4-5',
    surah: 'Al-Qāriʿah',
    ayah: '101:4-5',
    arabicName: 'القارعة',
    text: 'يَوْمَ يَكُونُ النَّاسُ كَالْفَرَاشِ الْمَبْثُوثِ ۝ وَتَكُونُ الْجِبَالُ كَالْعِهْنِ الْمَنفُوشِ',
    focusRules: [
      'Noon Mushaddadah (النَّاسُ)',
      'Qalqala (الْمَبْثُوثِ)',
      'Moon Letters (كَالْفَرَاشِ, الْجِبَالُ, كَالْعِهْنِ, الْمَنفُوشِ)',
      'Ikhfa (الْمَنفُوشِ)',
      'Maddul Aaridh (Stop)',
    ],
    difficulty: 'Advanced',
  },
];

import { getAllInfoExtracts, type QuranExtract } from '@/lib/infoData';

export function extractToPracticeVerse(ext: QuranExtract): PracticeVerse {
  return {
    id: ext.id,
    surah: typeof ext.surah === 'number' ? `Surah ${ext.surah}` : String(ext.surah),
    ayah: typeof ext.ayah === 'number' ? `Verse ${ext.ayah}` : String(ext.ayah),
    arabicName: ext.ruleTarget ? `قاعدة: ${ext.ruleTarget}` : 'مقتطف تجويدي',
    text: ext.text,
    focusRules: ext.ruleTarget ? [ext.ruleTarget] : ['INFO.md Practice Drill'],
    difficulty: 'Intermediate',
  };
}

export function findVerseByIdOrText(query?: string | null): PracticeVerse | null {
  if (!query) return null;
  const lower = query.trim().toLowerCase();

  // 1. Search in standard VERSES
  const foundVerse = VERSES.find(
    (v) => v.id.toLowerCase() === lower || v.text === query.trim(),
  );
  if (foundVerse) return foundVerse;

  // 2. Search in INFO.md extracts
  const extracts = getAllInfoExtracts();
  const foundExtract = extracts.find(
    (e) => e.id.toLowerCase() === lower || e.text === query.trim(),
  );
  if (foundExtract) {
    return extractToPracticeVerse(foundExtract);
  }

  return null;
}
