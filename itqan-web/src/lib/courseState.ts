import { TAJWEED_INFO_CHAPTERS, type TajweedChapter } from '@/lib/infoData';

export interface ChapterProgress {
  chapterId: string;
  completed: boolean;
  score: number; // 0..100
  lastTestedAt?: string;
}

export interface CourseProgressState {
  completedChapterIds: string[];
  chapterScores: Record<string, number>;
  passedExtractIdsByChapter: Record<string, string[]>;
  extractScoresByChapter: Record<string, Record<string, number>>;
  activeChapterId: string;
  xp: number;
}

const STORAGE_KEY = 'itqan_tajweed_course_progress';

const DEFAULT_STATE: CourseProgressState = {
  completedChapterIds: [],
  chapterScores: {},
  passedExtractIdsByChapter: {},
  extractScoresByChapter: {},
  activeChapterId: TAJWEED_INFO_CHAPTERS[0].id,
  xp: 0,
};

export function loadCourseProgress(): CourseProgressState {
  if (typeof localStorage === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      completedChapterIds: Array.isArray(parsed.completedChapterIds) ? parsed.completedChapterIds : [],
      chapterScores: typeof parsed.chapterScores === 'object' && parsed.chapterScores ? parsed.chapterScores : {},
      passedExtractIdsByChapter:
        typeof parsed.passedExtractIdsByChapter === 'object' && parsed.passedExtractIdsByChapter
          ? parsed.passedExtractIdsByChapter
          : {},
      extractScoresByChapter:
        typeof parsed.extractScoresByChapter === 'object' && parsed.extractScoresByChapter
          ? parsed.extractScoresByChapter
          : {},
      activeChapterId: parsed.activeChapterId || TAJWEED_INFO_CHAPTERS[0].id,
      xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveCourseProgress(state: CourseProgressState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/**
 * Checks if a chapter is unlocked.
 * Chapter 0 is always unlocked.
 * Any subsequent chapter is unlocked only if the preceding chapter is completed (or scored >= 60).
 */
export function isChapterUnlocked(chapterId: string, progress: CourseProgressState): boolean {
  const index = TAJWEED_INFO_CHAPTERS.findIndex((c) => c.id === chapterId);
  if (index <= 0) return true; // First chapter is always unlocked
  const prevChapter = TAJWEED_INFO_CHAPTERS[index - 1];
  return (
    progress.completedChapterIds.includes(prevChapter.id) ||
    (progress.chapterScores[prevChapter.id] ?? 0) >= 60
  );
}

export function recordLessonCompletion(chapterId: string, score: number): CourseProgressState {
  const current = loadCourseProgress();
  const alreadyCompleted = current.completedChapterIds.includes(chapterId);
  const prevScore = current.chapterScores[chapterId] || 0;
  const newScore = Math.max(prevScore, score);

  const updatedCompleted = alreadyCompleted
    ? current.completedChapterIds
    : [...current.completedChapterIds, chapterId];

  // Calculate XP gain (100 XP per first completion + bonus score XP)
  const xpGain = alreadyCompleted ? (score > prevScore ? (score - prevScore) * 2 : 0) : 100 + Math.round(score * 1.5);

  // Find next chapter if available
  const currentIndex = TAJWEED_INFO_CHAPTERS.findIndex((c) => c.id === chapterId);
  const nextChapter = TAJWEED_INFO_CHAPTERS[currentIndex + 1];

  const updatedState: CourseProgressState = {
    ...current,
    completedChapterIds: updatedCompleted,
    chapterScores: {
      ...current.chapterScores,
      [chapterId]: newScore,
    },
    activeChapterId: nextChapter ? nextChapter.id : chapterId,
    xp: current.xp + xpGain,
  };

  saveCourseProgress(updatedState);
  return updatedState;
}

/**
 * Records a single passed extract in a lesson with multiple exercises.
 * Only completes the entire chapter once ALL exercises for that chapter are passed.
 */
export function recordExtractPassed(
  chapterId: string,
  extractId: string,
  score: number,
  totalExtractsCount: number,
): { state: CourseProgressState; chapterNewlyCompleted: boolean } {
  const current = loadCourseProgress();
  const existingPassed = current.passedExtractIdsByChapter[chapterId] || [];
  const existingScores = current.extractScoresByChapter[chapterId] || {};

  const updatedPassed = existingPassed.includes(extractId)
    ? existingPassed
    : [...existingPassed, extractId];

  const updatedScores = {
    ...existingScores,
    [extractId]: Math.max(existingScores[extractId] || 0, score),
  };

  // Compute average score across all passed extracts
  const scoresArray = Object.values(updatedScores);
  const avgScore = scoresArray.length > 0
    ? Math.round(scoresArray.reduce((sum, val) => sum + val, 0) / scoresArray.length)
    : score;

  const isAllPassed = totalExtractsCount > 0 && updatedPassed.length >= totalExtractsCount;
  let chapterNewlyCompleted = false;

  let updatedCompletedChapterIds = current.completedChapterIds;
  let updatedChapterScores = current.chapterScores;
  let xpGain = 15; // 15 XP per exercise passed

  if (isAllPassed && !current.completedChapterIds.includes(chapterId)) {
    updatedCompletedChapterIds = [...current.completedChapterIds, chapterId];
    updatedChapterScores = {
      ...current.chapterScores,
      [chapterId]: avgScore,
    };
    xpGain += 100 + Math.round(avgScore * 1.5);
    chapterNewlyCompleted = true;
  } else if (isAllPassed) {
    updatedChapterScores = {
      ...current.chapterScores,
      [chapterId]: Math.max(current.chapterScores[chapterId] || 0, avgScore),
    };
  }

  const updatedState: CourseProgressState = {
    ...current,
    completedChapterIds: updatedCompletedChapterIds,
    chapterScores: updatedChapterScores,
    passedExtractIdsByChapter: {
      ...current.passedExtractIdsByChapter,
      [chapterId]: updatedPassed,
    },
    extractScoresByChapter: {
      ...current.extractScoresByChapter,
      [chapterId]: updatedScores,
    },
    xp: current.xp + xpGain,
  };

  saveCourseProgress(updatedState);
  return { state: updatedState, chapterNewlyCompleted };
}

export interface TierGroup {
  tierNumber: number;
  title: string;
  arabicTitle: string;
  summary: string;
  chapters: TajweedChapter[];
}

export const TAJWEED_TIERS: TierGroup[] = [
  {
    tierNumber: 1,
    title: 'Tier 1: Foundations & Articulation Points',
    arabicTitle: 'المقدمة ومخارج الحروف',
    summary: 'Etiquette, initiation formulas, discovery algorithm, and letter origins from throat to lips.',
    chapters: TAJWEED_INFO_CHAPTERS.filter((c) => ['aadaab', 'makhraj', 'tajweed-definition'].includes(c.id)),
  },
  {
    tierNumber: 2,
    title: 'Tier 2: Resonance & Heavy/Light Mechanics',
    arabicTitle: 'القلقلة وتفخيم اللام والنون والميم المشددتين',
    summary: 'Qalqala echoing mechanics, Mushaddadah Ghunnah, and Tafkheem/Tarqeeq for Laam of Allah.',
    chapters: TAJWEED_INFO_CHAPTERS.filter((c) => ['qalqala', 'noon-meem-mushaddadah', 'laam-allah'].includes(c.id)),
  },
  {
    tierNumber: 3,
    title: 'Tier 3: Rules of Meem Saakin',
    arabicTitle: 'أحكام الميم الساكنة',
    summary: 'The three distinct rules for Meem Saakin: Ikhfa Shafawi, Idghaam Shafawi, and Ithaar Shafawi.',
    chapters: TAJWEED_INFO_CHAPTERS.filter((c) => c.id === 'meem-saakin'),
  },
  {
    tierNumber: 4,
    title: 'Tier 4: Rules of Noon Saakin & Tanween',
    arabicTitle: 'أحكام النون الساكنة والتنوين',
    summary: 'Ikhfa (15 letters), Ithaar (6 throat letters), and Idghaam with and without Ghunnah.',
    chapters: TAJWEED_INFO_CHAPTERS.filter((c) => ['ikhfa-noon', 'ithaar-noon', 'idghaam-noon'].includes(c.id)),
  },
  {
    tierNumber: 5,
    title: 'Tier 5: Advanced Assimilation & Madd System',
    arabicTitle: 'الإدغام المتماثل والمتقارب والراء والنظام المدي',
    summary: 'Idghaam Mithlayn/Mutaqaaribayn, 8 rules of Raa, and Madd Asli, Muttasil, Munfasil, Laazim, Aaridh.',
    chapters: TAJWEED_INFO_CHAPTERS.filter((c) =>
      ['idghaam-mithlayn', 'idghaam-mutaqaaribayn', 'raa-rules', 'madd-system'].includes(c.id),
    ),
  },
  {
    tierNumber: 6,
    title: 'Tier 6: Recitation Mastery & Stopping Architecture',
    arabicTitle: 'الحروف الشمسية والقمرية والوقف والسجدات',
    summary: 'Sun & Moon letters, Waqf transformation rules, pause symbols, and Sajdah Tilawat execution.',
    chapters: TAJWEED_INFO_CHAPTERS.filter((c) =>
      ['sun-letters', 'moon-letters', 'waqf-rules', 'pause-symbols', 'sajdah-verses'].includes(c.id),
    ),
  },
];
