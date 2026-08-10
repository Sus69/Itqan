/**
 * A small starter set of practice verses for the Tajweed Studio.
 * `surah` / `ayah` are display metadata; `text` is the exact string
 * sent to POST /api/v1/tajweed/analyze as the `text` form field.
 */
export interface PracticeVerse {
  id: string;
  surah: string;
  ayah: string;
  arabicName: string;
  text: string;
  focusRules: string[]; // human-readable rule tags
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export const VERSES: PracticeVerse[] = [
  {
    id: 'fatiha-1',
    surah: 'Al-Fātiḥah',
    ayah: '1:1',
    arabicName: 'الفاتحة',
    text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    focusRules: ['Laam of Allah (Tafkheem)', 'Ghunnah'],
    difficulty: 'Beginner',
  },
  {
    id: 'fatiha-7',
    surah: 'Al-Fātiḥah',
    ayah: '1:7',
    arabicName: 'الفاتحة',
    text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    focusRules: ['Ikhfa Shafawi (مْ + ب)', 'Ghunnah', 'Qalqala'],
    difficulty: 'Intermediate',
  },
  {
    id: 'ikhlas-1',
    surah: 'Al-Ikhlāṣ',
    ayah: '112:1',
    arabicName: 'الإخلاص',
    text: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
    focusRules: ['Qalqala (ق and د)', 'Laam of Allah', 'Idghaam'],
    difficulty: 'Beginner',
  },
  {
    id: 'ikhlas-2',
    surah: 'Al-Ikhlāṣ',
    ayah: '112:2',
    arabicName: 'الإخلاص',
    text: 'اللَّهُ الصَّمَدُ',
    focusRules: ['Laam of Allah (Tafkheem)', 'Qalqala (د)'],
    difficulty: 'Beginner',
  },
  {
    id: 'alaq-1',
    surah: 'Al-ʿAlaq',
    ayah: '96:1',
    arabicName: 'العلق',
    text: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',
    focusRules: ['Qalqala (ق)', 'Ghunnah (نّ)'],
    difficulty: 'Intermediate',
  },
  {
    id: 'qariah-4',
    surah: 'Al-Qāriʿah',
    ayah: '101:4',
    arabicName: 'القارعة',
    text: 'يَوْمَ يَكُونُ النَّاسُ كَالْفَرَاشِ الْمَبْثُوثِ',
    focusRules: ['Noon & Meem Mushaddadah', 'Ikhfa', 'Qalqala (ب)'],
    difficulty: 'Advanced',
  },
];
