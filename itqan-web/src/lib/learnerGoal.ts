import type { IconName } from '@/components/Icon';

export type Goal = 'reading' | 'tajweed' | 'refine';

export const ONBOARDING_KEY = 'itqan_onboarding_v2_complete';
export const GOAL_KEY = 'itqan_learning_goal';

export interface LearningGoalOption {
  id: Goal;
  icon: IconName;
  title: string;
  body: string;
  route: string;
}

export const GOALS: LearningGoalOption[] = [
  {
    id: 'reading',
    icon: 'book',
    title: 'Learn to read Arabic',
    body: 'Begin with letters, sounds, and confident Quranic reading.',
    route: '/learn/qaida',
  },
  {
    id: 'tajweed',
    icon: 'learn',
    title: 'Learn Tajweed',
    body: 'Study one rule at a time, then hear how it feels in recitation.',
    route: '/learn/tajweed',
  },
  {
    id: 'refine',
    icon: 'practice',
    title: 'Refine my recitation',
    body: 'Start with a guided recording and focused feedback.',
    route: '/practice',
  },
];

export function getLearningGoal(): Goal | null {
  const goal = typeof window !== 'undefined' ? localStorage.getItem(GOAL_KEY) : null;
  return goal === 'reading' || goal === 'tajweed' || goal === 'refine' ? goal : null;
}

export function setLearningGoal(goal: Goal): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(GOAL_KEY, goal);
  }
}
