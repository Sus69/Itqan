import type { IconName } from '@/components/Icon';
import type { Goal } from '@/lib/learnerGoal';
import { QAIDA_LESSONS } from '@/lib/qaidaData';
import { TAJWEED_INFO_CHAPTERS } from '@/lib/infoData';
import type { QaidaState } from '@/lib/qaidaState';
import type { CourseProgressState } from '@/lib/courseState';
import { weakRules, type AttemptRecord } from '@/lib/sessionLog';

/**
 * The single recommended next action.
 *
 * Today shows exactly one of these, and it has to be genuinely next: derived
 * from what the learner has finished, not a fixed "start chapter 1" that keeps
 * pointing at completed work. An outstanding rule from the Mistake Bank always
 * outranks new material for a learner who is refining, because revisiting a
 * flagged rule is what actually moves their recitation.
 */
export interface NextStep {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  to: string;
  icon: IconName;
}

interface Snapshot {
  qaida: QaidaState;
  course: CourseProgressState;
  attempts: AttemptRecord[];
}

const PRACTICE_STEP: NextStep = {
  eyebrow: 'Your practice focus',
  title: 'Make one clear recording',
  body: 'Choose a target, recite it naturally, and take away a single correction to work on.',
  cta: 'Open a practice session',
  to: '/practice/session',
  icon: 'practice',
};

export function resolveNextStep(goal: Goal, { qaida, course, attempts }: Snapshot): NextStep {
  if (goal === 'refine') {
    const [weakest] = weakRules(attempts);
    if (weakest) {
      return {
        eyebrow: 'Pick up where you left off',
        title: `Revisit ${weakest.ruleName}`,
        body: `This rule was flagged on ${weakest.targetLabel}. Reciting that target cleanly clears it from your review list.`,
        cta: 'Recite it again',
        to: weakest.retryTo,
        icon: 'restart',
      };
    }
    return PRACTICE_STEP;
  }

  if (goal === 'reading') {
    const lesson = QAIDA_LESSONS.find((l) => !qaida.completedLessonIds.includes(l.id));
    if (lesson) {
      return {
        eyebrow: 'Your reading foundation',
        title: `Lesson ${lesson.id}: ${lesson.titleEnglish}`,
        body: lesson.summary,
        cta: `Open lesson ${lesson.id}`,
        to: `/learn/qaida/lesson/${lesson.id}`,
        icon: 'book',
      };
    }
    // Qaida finished — the honest next move is Tajweed, not a repeated lesson.
    return resolveNextStep('tajweed', { qaida, course, attempts });
  }

  const chapter = TAJWEED_INFO_CHAPTERS.find((c) => !course.completedChapterIds.includes(c.id));
  if (chapter) {
    return {
      eyebrow: 'Your Tajweed path',
      title: `Chapter ${chapter.chapterNumber}: ${chapter.title}`,
      body: chapter.summary,
      cta: `Open chapter ${chapter.chapterNumber}`,
      to: `/learn/tajweed/lesson/${chapter.id}`,
      icon: 'learn',
    };
  }

  return PRACTICE_STEP;
}
