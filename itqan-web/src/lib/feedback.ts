import type { RuleEvaluation, TajweedResult } from '@/lib/api';

/**
 * Itqān (إتقان) — one scoring definition for the whole app.
 *
 * Both the practice session and the course lessons used to compute their own
 * blend of similarity, character accuracy and alignment confidence, which meant
 * the same recitation could score differently depending on which screen the
 * learner was standing on. This module is now the only place a score is derived.
 */

/** Weights: what was said, how accurately, and how confidently we aligned it. */
const W_SIMILARITY = 0.4;
const W_CHAR_ACCURACY = 0.4;
const W_ALIGNMENT = 0.2;

/** A score at or above this is treated as a pass for progression purposes. */
export const PASS_THRESHOLD = 60;

export interface FeedbackPriority {
  ruleId: string;
  ruleName: string;
  arabicName: string;
  cue: string;
  expected: string;
  detected: string;
}

export function overallScore(result: TajweedResult): number {
  const similarity = result.phrase_verification.similarity_percentage;
  const charAccuracy = result.phrase_verification.character_accuracy_percentage;
  const alignment = result.alignment_confidence;
  return Math.round(
    Math.min(
      100,
      Math.max(0, similarity * W_SIMILARITY + charAccuracy * W_CHAR_ACCURACY + alignment * W_ALIGNMENT),
    ),
  );
}

/** Rules the engine actually evaluated — the denominator for "n of m passed". */
export function applicableRules(evaluations: RuleEvaluation[]): RuleEvaluation[] {
  return evaluations.filter((e) => e.applicable && e.status !== 'not_applicable');
}

/**
 * Picks the one correction worth acting on now. Failures outrank needs-review,
 * which outranks an uncertain reading, and within a status the lowest-confidence
 * rule wins — that is the one holding the recitation back.
 */
export function pickPriority(evaluations: RuleEvaluation[]): FeedbackPriority | null {
  const rank: Record<string, number> = { failed: 0, needs_review: 1, uncertain: 2 };
  const candidate = evaluations
    .filter((e) => e.applicable && e.status in rank)
    .sort(
      (a, b) => rank[a.status] - rank[b.status] || (a.confidence_score ?? 0) - (b.confidence_score ?? 0),
    )[0];

  if (!candidate) return null;
  return {
    ruleId: candidate.rule_id,
    ruleName: candidate.rule_name,
    arabicName: candidate.arabic_name,
    cue: candidate.suggestion || candidate.description,
    expected: candidate.expected_metric,
    detected: candidate.detected_metric,
  };
}

/** Did this take clear the bar for marking the target as practised? */
export function isPass(score: number): boolean {
  return score >= PASS_THRESHOLD;
}

/**
 * Did the learner actually recite *this* target, rather than something else?
 *
 * A high rule-confidence score on unrelated audio must never mark a lesson
 * passed, so progression is gated on phrase verification as well as on the
 * overall score. The thresholds are deliberately forgiving of ASR error while
 * still rejecting ambient noise and unrelated speech.
 */
export function speechMatchesTarget(result: TajweedResult): boolean {
  const similarity = result.phrase_verification.similarity_percentage;
  const charAccuracy = result.phrase_verification.character_accuracy_percentage;
  return (similarity >= 35 && charAccuracy >= 40) || similarity >= 50 || charAccuracy >= 65;
}
