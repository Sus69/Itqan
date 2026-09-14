/**
 * Qa'idah progress, stored on this device.
 *
 * The distinction this module exists to hold is between *heard* and *practiced*.
 * Playing a tile's pronunciation guide is listening; recording your own voice is
 * practice. The earlier shape stored only `practicedTiles` but filled it on
 * playback, so a learner who clicked through a lesson without speaking once was
 * shown as having practiced all of it. Listening is now recorded as listening,
 * and the completion gate reads both.
 *
 * There is no points total here. The previous version awarded XP for playing a
 * tile and for pressing "complete", which measured clicking rather than
 * learning, so the app no longer keeps a figure it cannot honestly earn.
 */

import { QAIDA_LESSONS, type QaidaLesson } from '@/lib/qaidaData';

export interface QaidaLessonProgress {
  lessonId: number;
  completed: boolean;
  completedAt?: string;
  /** Tiles whose pronunciation guide has been played through. */
  heardTiles: string[];
  /** Tiles the learner has recorded themselves reciting. */
  practicedTiles: string[];
  /** Result of the most recent quiz attempt, 0–100. Absent means never taken. */
  quizScore?: number;
  quizAttempts: number;
}

export interface QaidaPreferences {
  audioMode: 'rawan' | 'hijjay';
  audioPlaybackRate: number;
  showTransliteration: boolean;
}

export interface QaidaState {
  completedLessonIds: number[];
  activeLessonId: number;
  preferences: QaidaPreferences;
  lessonProgress: Record<number, QaidaLessonProgress>;
}

const STORAGE_KEY = 'itqan_qaida_state_v1';

const DEFAULT_PREFERENCES: QaidaPreferences = {
  audioMode: 'rawan',
  audioPlaybackRate: 1.0,
  showTransliteration: true,
};

const LAST_LESSON_ID = QAIDA_LESSONS[QAIDA_LESSONS.length - 1]?.id ?? 1;

function emptyProgress(lessonId: number): QaidaLessonProgress {
  return { lessonId, completed: false, heardTiles: [], practicedTiles: [], quizAttempts: 0 };
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function numbers(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((v): v is number => typeof v === 'number') : [];
}

/**
 * Reads stored progress into the current shape.
 *
 * Records written before the heard/practiced split kept playback in
 * `practicedTiles`, so they are read back as what they actually were — tiles the
 * learner listened to. Completed lessons stay completed; the stricter gate
 * applies from here on rather than retroactively.
 */
function normalise(raw: unknown): QaidaState {
  const parsed = (raw ?? {}) as Record<string, unknown>;
  const prefs = (parsed.preferences ?? {}) as Record<string, unknown>;
  const storedProgress = (parsed.lessonProgress ?? {}) as Record<string, unknown>;

  const lessonProgress: Record<number, QaidaLessonProgress> = {};
  for (const [key, value] of Object.entries(storedProgress)) {
    const lessonId = Number(key);
    if (!Number.isFinite(lessonId)) continue;
    const entry = (value ?? {}) as Record<string, unknown>;
    const hasSplit = Array.isArray(entry.heardTiles);
    lessonProgress[lessonId] = {
      lessonId,
      completed: entry.completed === true,
      completedAt: typeof entry.completedAt === 'string' ? entry.completedAt : undefined,
      heardTiles: hasSplit ? strings(entry.heardTiles) : strings(entry.practicedTiles),
      practicedTiles: hasSplit ? strings(entry.practicedTiles) : [],
      quizScore: typeof entry.quizScore === 'number' ? entry.quizScore : undefined,
      quizAttempts: typeof entry.quizAttempts === 'number' ? entry.quizAttempts : 0,
    };
  }

  const activeLessonId = typeof parsed.activeLessonId === 'number' ? parsed.activeLessonId : 1;

  return {
    completedLessonIds: numbers(parsed.completedLessonIds),
    activeLessonId: Math.min(LAST_LESSON_ID, Math.max(1, activeLessonId)),
    preferences: {
      audioMode: prefs.audioMode === 'hijjay' ? 'hijjay' : 'rawan',
      audioPlaybackRate:
        typeof prefs.audioPlaybackRate === 'number'
          ? prefs.audioPlaybackRate
          : DEFAULT_PREFERENCES.audioPlaybackRate,
      showTransliteration: prefs.showTransliteration !== false,
    },
    lessonProgress,
  };
}

export function loadQaidaState(): QaidaState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalise(raw ? JSON.parse(raw) : {});
  } catch {
    return normalise({});
  }
}

export function saveQaidaState(state: QaidaState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Qaida state', err);
  }
}

export function lessonProgressFor(state: QaidaState, lessonId: number): QaidaLessonProgress {
  return state.lessonProgress[lessonId] ?? emptyProgress(lessonId);
}

function update(
  lessonId: number,
  change: (progress: QaidaLessonProgress) => QaidaLessonProgress,
  outer: (state: QaidaState) => Partial<QaidaState> = () => ({}),
): QaidaState {
  const current = loadQaidaState();
  const next: QaidaState = {
    ...current,
    ...outer(current),
    lessonProgress: {
      ...current.lessonProgress,
      [lessonId]: change(lessonProgressFor(current, lessonId)),
    },
  };
  saveQaidaState(next);
  return next;
}

/** The learner played this tile's pronunciation guide through to the end. */
export function markTileHeard(lessonId: number, tileId: string): QaidaState {
  return update(lessonId, (progress) => ({
    ...progress,
    heardTiles: Array.from(new Set([...progress.heardTiles, tileId])),
  }));
}

/** The learner recorded their own recitation of this tile. */
export function markTilePracticed(lessonId: number, tileId: string): QaidaState {
  return update(lessonId, (progress) => ({
    ...progress,
    // Recording a tile implies having worked with it, so it counts as heard too.
    heardTiles: Array.from(new Set([...progress.heardTiles, tileId])),
    practicedTiles: Array.from(new Set([...progress.practicedTiles, tileId])),
  }));
}

/**
 * Stores a quiz result exactly as it came out, including a failing one.
 * Recording the attempt is separate from completing the lesson: answering a
 * question is not the same as having practiced the sounds.
 */
export function recordQuizResult(lessonId: number, score: number): QaidaState {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return update(lessonId, (progress) => ({
    ...progress,
    quizScore: clamped,
    quizAttempts: progress.quizAttempts + 1,
  }));
}

/**
 * What a lesson still needs before it can be marked complete, as sentences the
 * UI can show. An empty array means the requirements are met.
 *
 * Both requirements exist for a reason: hearing every tile is what makes the
 * lesson's content covered, and one recording is what makes it practice rather
 * than reading. Passing the quiz is not required — it checks recognition, which
 * is not the skill the lesson teaches.
 */
export function remainingToComplete(lesson: QaidaLesson, progress: QaidaLessonProgress): string[] {
  const missing: string[] = [];
  const unheard = lesson.tiles.filter((t) => !progress.heardTiles.includes(t.id)).length;
  if (unheard > 0) {
    missing.push(
      unheard === 1
        ? 'Listen to the 1 remaining tile'
        : `Listen to the ${unheard} remaining tiles`,
    );
  }
  if (progress.practicedTiles.length === 0) {
    missing.push('Record yourself on at least one tile');
  }
  return missing;
}

/**
 * Marks a lesson complete and moves the roadmap position forward.
 * Callers must check `remainingToComplete` first — this does not re-check, so
 * that the reason a lesson cannot be completed stays visible in the UI rather
 * than turning into a silently ignored click.
 */
export function completeLesson(lessonId: number): QaidaState {
  return update(
    lessonId,
    (progress) => ({
      ...progress,
      completed: true,
      completedAt: progress.completedAt ?? new Date().toISOString(),
    }),
    (state) => ({
      completedLessonIds: Array.from(new Set([...state.completedLessonIds, lessonId])),
      activeLessonId: Math.min(LAST_LESSON_ID, Math.max(state.activeLessonId, lessonId + 1)),
    }),
  );
}

export function updateQaidaPreferences(prefs: Partial<QaidaPreferences>): QaidaState {
  const current = loadQaidaState();
  const next: QaidaState = {
    ...current,
    preferences: { ...current.preferences, ...prefs },
  };
  saveQaidaState(next);
  return next;
}
