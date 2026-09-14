import { useState, type ReactNode } from 'react';
import type { AlignmentChar, RuleEvaluation } from '@/lib/api';
import { Button, Card, ScoreRing } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { RuleEvaluationCard } from '@/components/RuleEvaluationCard';
import { ColorCodedVerse } from '@/components/ColorCodedVerse';
import { applicableRules, pickPriority } from '@/lib/feedback';
import { cn } from '@/lib/cn';

/**
 * CMP-FBK-001 — the feedback surface, in the order the learner needs it:
 *
 *   1. a supportive outcome,
 *   2. exactly one priority correction, with what was expected and heard,
 *   3. a prominent retry on the same target,
 *   4. rule-by-rule and character-level detail behind disclosures,
 *   5. the next step out of the session.
 *
 * Everything below the priority correction is optional reading. The score is
 * present but deliberately not the headline.
 */
export function SessionFeedback({
  score,
  evaluations,
  alignment,
  targetText,
  onRetry,
  retryLabel = 'Try the same target again',
  nextAction,
  storageNote,
  className,
}: {
  score: number;
  evaluations: RuleEvaluation[];
  alignment?: AlignmentChar[];
  targetText: string;
  onRetry: () => void;
  retryLabel?: string;
  nextAction?: ReactNode;
  /** Where this attempt was actually stored — never imply more than is true. */
  storageNote?: string;
  className?: string;
}) {
  const [showRules, setShowRules] = useState(false);
  const [showChars, setShowChars] = useState(false);

  const applicable = applicableRules(evaluations);
  const passed = applicable.filter((e) => e.status === 'passed').length;
  const priority = pickPriority(evaluations);

  const outcome =
    score >= 85
      ? 'A clear, well-formed recitation of this target.'
      : score >= 60
        ? 'A solid attempt with one thing left to settle.'
        : 'Worth another attempt — the cue below is the fastest way in.';

  return (
    <div className={cn('space-y-4', className)}>
      {/* 1 — Outcome */}
      <Card className="flex flex-wrap items-center gap-5">
        <ScoreRing value={score} label="Overall" size={92} stroke={8} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
            Session outcome
          </p>
          <h2 className="mt-1 text-lg font-extrabold text-ink">{outcome}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            {applicable.length > 0
              ? `${passed} of ${applicable.length} applicable Tajweed checks passed on this take.`
              : 'No Tajweed rules applied to this target, so only pronunciation accuracy was scored.'}
          </p>
          {storageNote && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
              <Icon name="info" size={13} aria-hidden="true" /> {storageNote}
            </p>
          )}
        </div>
      </Card>

      {/* 2 — One priority correction, with expected vs heard */}
      <Card
        className={
          priority
            ? 'border-gold-500/30 bg-gold-500/10'
            : 'border-brand-500/30 bg-brand-500/10'
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3.5">
            <span
              className={cn(
                'grid size-11 shrink-0 place-items-center rounded-xl text-white',
                priority ? 'bg-gold-500' : 'bg-brand-600',
              )}
            >
              <Icon name={priority ? 'info' : 'check'} size={21} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
                {priority ? 'Your next correction' : 'Nothing to correct'}
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-ink">
                {priority ? priority.ruleName : 'This target is ready to move on from'}
              </h3>
              {priority && (
                <p className="arabic-text mt-0.5 text-sm text-ink-soft" dir="rtl" lang="ar">
                  {priority.arabicName}
                </p>
              )}
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                {priority
                  ? priority.cue
                  : 'Repeat it once more if you would like it to feel automatic, or continue to the next step.'}
              </p>

              {priority && (
                <dl className="mt-3 flex flex-wrap gap-2 text-xs">
                  <div className="rounded-lg bg-surface px-2.5 py-1.5">
                    <dt className="font-bold text-ink-faint">Expected</dt>
                    <dd className="text-ink">{priority.expected}</dd>
                  </div>
                  <div className="rounded-lg bg-surface px-2.5 py-1.5">
                    <dt className="font-bold text-ink-faint">Heard</dt>
                    <dd className="text-ink">{priority.detected}</dd>
                  </div>
                </dl>
              )}
            </div>
          </div>

          {/* 3 — Retry the same target, always the most prominent action here */}
          <Button size="lg" onClick={onRetry} className="shrink-0">
            <Icon name="restart" size={17} aria-hidden="true" /> {retryLabel}
          </Button>
        </div>
      </Card>

      {/* 4 — Detail on request only */}
      <div className="space-y-2">
        <DisclosureRow
          open={showRules}
          onToggle={() => setShowRules((v) => !v)}
          label={`All rule checks (${applicable.length || evaluations.length})`}
          hint="Every rule the engine considered, with expected and detected values."
        >
          <div className="space-y-2">
            {evaluations.map((e) => (
              <RuleEvaluationCard key={e.rule_id} evaluation={e} />
            ))}
          </div>
        </DisclosureRow>

        {alignment && alignment.length > 0 && (
          <DisclosureRow
            open={showChars}
            onToggle={() => setShowChars((v) => !v)}
            label="Character-by-character comparison"
            hint="Where the engine heard something other than the target letter."
          >
            <ColorCodedVerse expectedText={targetText} alignment={alignment} evaluations={evaluations} />
          </DisclosureRow>
        )}
      </div>

      {/* 5 — The way out of the session */}
      {nextAction && <div className="flex flex-wrap items-center gap-3">{nextAction}</div>}
    </div>
  );
}

function DisclosureRow({
  open,
  onToggle,
  label,
  hint,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">{label}</p>
          <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>
        </div>
        <Icon
          name="arrowRight"
          size={16}
          aria-hidden="true"
          className={cn('shrink-0 text-ink-faint transition-transform', open && 'rotate-90')}
        />
      </button>
      {open && <div className="anim-fade-up border-t border-border p-4">{children}</div>}
    </div>
  );
}
