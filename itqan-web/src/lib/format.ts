/** Formatting helpers for Itqān UI. */

export function formatSeconds(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function pct(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

/** Map a 0..1 cosine-similarity confidence to a 0..100 display percentage. */
export function confidencePct(confidence: number): number {
  return Math.round(confidence * 1000) / 10;
}

/** Status metadata shared by Tajweed evaluation cards. */
export type EvalStatus =
  | 'passed'
  | 'needs_review'
  | 'failed'
  | 'uncertain'
  | 'not_applicable';

export const STATUS_META: Record<
  EvalStatus,
  {
    label: string;
    /** hex colors chosen to be readable on light surfaces */
    badge: string; // tailwind classes
    dot: string;
    char: string; // character highlight color (alignment)
  }
> = {
  passed: {
    label: 'Passed',
    badge: 'bg-success-soft text-success',
    dot: 'bg-success',
    char: 'text-success',
  },
  needs_review: {
    label: 'Needs Practice',
    badge: 'bg-warning-soft text-warning',
    dot: 'bg-warning',
    char: 'text-warning',
  },
  failed: {
    label: 'Needs Work',
    badge: 'bg-error-soft text-error',
    dot: 'bg-error',
    char: 'text-error',
  },
  uncertain: {
    label: 'Uncertain',
    badge: 'bg-info-soft text-info',
    dot: 'bg-info',
    char: 'text-info',
  },
  not_applicable: {
    label: 'Not Applicable',
    badge: 'bg-sand-100 text-sand-600',
    dot: 'bg-sand-300',
    char: 'text-ink',
  },
};

/** Map an alignment character status to a display color. */
export function alignmentCharClass(status: string): string {
  switch (status) {
    case 'correct':
      return 'text-ink';
    case 'mismatch':
    case 'missing':
      return 'text-error underline decoration-error/40 decoration-2 underline-offset-4';
    case 'extra':
      return 'text-warning';
    default:
      return 'text-ink';
  }
}
