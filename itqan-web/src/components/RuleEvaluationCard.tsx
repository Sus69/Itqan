import { useState } from 'react';
import type { RuleEvaluation } from '@/lib/api';
import { STATUS_META, type EvalStatus } from '@/lib/format';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';

const TIER_LABELS: Record<number, string> = {
  1: 'Foundation',
  2: 'Core',
  3: 'Meem Rules',
  4: 'Noon Rules',
  5: 'Madd',
  6: 'Sun & Moon',
};

/**
 * CMP-FBK-003 Correction Card + CMP-FBK-004 Rule Reminder.
 * Renders one Tajweed rule evaluation from the backend pipeline.
 */
export function RuleEvaluationCard({ evaluation }: { evaluation: RuleEvaluation }) {
  const [open, setOpen] = useState(false);
  const status = (evaluation.status as EvalStatus) ?? 'not_applicable';
  const meta = STATUS_META[status] ?? STATUS_META.not_applicable;
  const applicable = evaluation.applicable && status !== 'not_applicable';

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface transition-shadow',
        applicable ? 'border-border' : 'border-dashed border-border/70 opacity-70',
        open && 'shadow-[var(--shadow-soft)]',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        {/* status dot */}
        <span className={cn('size-2.5 shrink-0 rounded-full', meta.dot)} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{evaluation.rule_name}</p>
          <p className="arabic-text truncate text-xs text-ink-faint">{evaluation.arabic_name}</p>
        </div>

        <span className={cn('hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex', meta.badge)}>
          {meta.label}
        </span>

        {applicable && typeof evaluation.confidence_score === 'number' && (
          <span className="shrink-0 text-sm font-bold tabular-nums text-ink">
            {Math.round(evaluation.confidence_score)}
            <span className="text-[10px] font-semibold text-ink-faint">/100</span>
          </span>
        )}

        <Icon
          name="arrowRight"
          size={16}
          className={cn('shrink-0 text-ink-faint transition-transform', open && 'rotate-90')}
        />
      </button>

      {open && (
        <div className="anim-fade-up space-y-3 border-t border-border px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">
              Tier {evaluation.tier} · {TIER_LABELS[evaluation.tier] ?? 'Rule'}
            </span>
            <span className="rounded-full bg-sand-100 px-2.5 py-1 text-sand-700">
              Expected: {evaluation.expected_metric}
            </span>
            <span className="rounded-full bg-sand-100 px-2.5 py-1 text-sand-700">
              Detected: {evaluation.detected_metric}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-ink-soft">{evaluation.description}</p>

          {applicable && evaluation.suggestion && (
            <div
              className={cn(
                'flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm leading-relaxed',
                status === 'passed'
                  ? 'bg-success-soft text-success'
                  : status === 'needs_review'
                    ? 'bg-warning-soft text-warning'
                    : 'bg-info-soft text-info',
              )}
            >
              <Icon name={status === 'passed' ? 'check' : 'info'} size={16} className="mt-0.5 shrink-0" />
              <p>{evaluation.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
