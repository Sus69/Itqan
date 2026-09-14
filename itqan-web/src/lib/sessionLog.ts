/**
 * Itqān (إتقان) — Practice attempt log.
 *
 * Every analysed recitation writes one record here, on the device, whether or
 * not the learner is signed in. It is the source for the Mistake Bank, the
 * "practice this next" recommendation, and the locally-verifiable half of
 * Insights. `synced` records whether the backend also stored the attempt, so
 * the UI can say where the data lives instead of implying it is saved to an
 * account when it is not.
 */

export type AttemptSource = 'practice' | 'tajweed-lesson' | 'qaida-lesson';

export interface WeakRule {
  ruleId: string;
  ruleName: string;
  /** Most recent attempt that flagged this rule. */
  lastAt: number;
  occurrences: number;
  targetLabel: string;
  targetText: string;
  retryTo: string;
}

export interface AttemptRecord {
  id: string;
  at: number;
  source: AttemptSource;
  /** Human label for the target, e.g. "Al-Fātiḥah · 1". */
  targetLabel: string;
  /** Arabic text that was recited. */
  targetText: string;
  /** Route that re-opens this exact target. */
  retryTo: string;
  score: number;
  passedRules: number;
  reviewRules: number;
  priorityRuleId: string | null;
  priorityRuleName: string | null;
  /** True only when the backend confirmed it stored this attempt. */
  synced: boolean;
}

const STORAGE_KEY = 'itqan_attempt_log_v1';
const MAX_RECORDS = 40;

export function loadAttempts(): AttemptRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r): r is AttemptRecord => typeof r?.id === 'string');
  } catch {
    return [];
  }
}

function saveAttempts(records: AttemptRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
  } catch (err) {
    console.error('Failed to save attempt log', err);
  }
}

export function recordAttempt(input: Omit<AttemptRecord, 'id' | 'at'>): AttemptRecord {
  const record: AttemptRecord = {
    ...input,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
  };
  saveAttempts([record, ...loadAttempts()]);
  return record;
}

export function clearAttempts(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear attempt log', err);
  }
}

/**
 * Rules the learner has been asked to review, most frequent first. A rule drops
 * off the list once a later attempt on the same target stopped flagging it.
 */
export function weakRules(records: AttemptRecord[] = loadAttempts()): WeakRule[] {
  const byRule = new Map<string, WeakRule>();
  const resolvedTargets = new Set<string>();

  // Newest first — a clean later attempt on a target clears its earlier flags.
  for (const record of records) {
    const targetKey = `${record.retryTo}::${record.targetText}`;
    if (!record.priorityRuleId) {
      resolvedTargets.add(targetKey);
      continue;
    }
    if (resolvedTargets.has(targetKey)) continue;

    const existing = byRule.get(record.priorityRuleId);
    if (existing) {
      existing.occurrences += 1;
      continue;
    }
    byRule.set(record.priorityRuleId, {
      ruleId: record.priorityRuleId,
      ruleName: record.priorityRuleName ?? record.priorityRuleId,
      lastAt: record.at,
      occurrences: 1,
      targetLabel: record.targetLabel,
      targetText: record.targetText,
      retryTo: record.retryTo,
    });
  }

  return Array.from(byRule.values()).sort(
    (a, b) => b.occurrences - a.occurrences || b.lastAt - a.lastAt,
  );
}

export function averageScore(records: AttemptRecord[]): number | null {
  if (records.length === 0) return null;
  return Math.round(records.reduce((sum, r) => sum + r.score, 0) / records.length);
}
