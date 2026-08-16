/**
 * Itqān (إتقان) - Qa'idah LocalStorage Persistence & State Engine
 */

export interface QaidaLessonProgress {
  lessonId: number;
  completed: boolean;
  completedAt?: string;
  practicedTiles: string[];
  highScoreQuiz?: number;
}

export interface QaidaPreferences {
  audioMode: 'rawan' | 'hijjay';
  audioPlaybackRate: number;
  showTransliteration: boolean;
  autoAdvance: boolean;
}

export interface QaidaState {
  completedLessonIds: number[];
  activeLessonId: number;
  practicedTileIds: string[];
  totalXp: number;
  streakDays: number;
  preferences: QaidaPreferences;
  lessonProgress: Record<number, QaidaLessonProgress>;
}

const STORAGE_KEY = 'itqan_qaida_state_v1';

const DEFAULT_STATE: QaidaState = {
  completedLessonIds: [],
  activeLessonId: 1,
  practicedTileIds: [],
  totalXp: 0,
  streakDays: 1,
  preferences: {
    audioMode: 'rawan',
    audioPlaybackRate: 1.0,
    showTransliteration: true,
    autoAdvance: false,
  },
  lessonProgress: {},
};

export function loadQaidaState(): QaidaState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveQaidaState(state: QaidaState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Qaida state', err);
  }
}

export function markTilePracticed(lessonId: number, tileId: string): QaidaState {
  const current = loadQaidaState();
  const currentLessonProgress = current.lessonProgress[lessonId] || {
    lessonId,
    completed: false,
    practicedTiles: [],
  };

  const updatedPracticedTiles = Array.from(
    new Set([...currentLessonProgress.practicedTiles, tileId])
  );

  const updatedGlobalTiles = Array.from(
    new Set([...current.practicedTileIds, tileId])
  );

  const newState: QaidaState = {
    ...current,
    practicedTileIds: updatedGlobalTiles,
    totalXp: current.totalXp + 5,
    lessonProgress: {
      ...current.lessonProgress,
      [lessonId]: {
        ...currentLessonProgress,
        practicedTiles: updatedPracticedTiles,
      },
    },
  };

  saveQaidaState(newState);
  return newState;
}

export function completeLesson(lessonId: number, quizScore?: number): QaidaState {
  const current = loadQaidaState();
  const currentLessonProgress = current.lessonProgress[lessonId] || {
    lessonId,
    completed: false,
    practicedTiles: [],
  };

  const updatedCompletedIds = Array.from(
    new Set([...current.completedLessonIds, lessonId])
  );

  const isFirstCompletion = !current.completedLessonIds.includes(lessonId);

  const newState: QaidaState = {
    ...current,
    completedLessonIds: updatedCompletedIds,
    activeLessonId: Math.min(22, Math.max(current.activeLessonId, lessonId + 1)),
    totalXp: current.totalXp + (isFirstCompletion ? 50 : 10),
    lessonProgress: {
      ...current.lessonProgress,
      [lessonId]: {
        ...currentLessonProgress,
        completed: true,
        completedAt: currentLessonProgress.completedAt || new Date().toISOString(),
        highScoreQuiz: Math.max(currentLessonProgress.highScoreQuiz || 0, quizScore || 0),
      },
    },
  };

  saveQaidaState(newState);
  return newState;
}

export function updateQaidaPreferences(prefs: Partial<QaidaPreferences>): QaidaState {
  const current = loadQaidaState();
  const newState: QaidaState = {
    ...current,
    preferences: {
      ...current.preferences,
      ...prefs,
    },
  };
  saveQaidaState(newState);
  return newState;
}
