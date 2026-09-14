import type { RuleEvaluation } from '@/lib/api';
import { Button, Card } from '@/components/ui';
import { Icon } from '@/components/Icon';

export function PriorityFeedback({ evaluations, onRetry }: { evaluations: RuleEvaluation[]; onRetry: () => void }) {
  const applicable = evaluations.filter((item) => item.applicable && item.status !== 'not_applicable');
  const priority = applicable.find((item) => item.status === 'failed' || item.status === 'needs_review' || item.status === 'uncertain');
  const passed = applicable.filter((item) => item.status === 'passed').length;
  const title = priority ? `Focus on ${priority.rule_name} next` : 'A strong recitation to build on';
  const body = priority ? priority.suggestion || priority.description : `You passed ${passed} of ${applicable.length} applicable checks. Repeat the same target once more to make the skill feel natural.`;

  return (
    <Card
      className={
        priority
          ? 'border-gold-500/30 bg-gold-500/10'
          : 'border-brand-500/30 bg-brand-500/10'
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span
            className={
              priority
                ? 'grid size-11 shrink-0 place-items-center rounded-xl bg-gold-500 text-white'
                : 'grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white'
            }
          >
            <Icon name={priority ? 'info' : 'check'} size={21} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">Your next step</p>
            <h2 className="mt-1 text-lg font-extrabold text-ink">{title}</h2>
            {priority && <p className="arabic-text mt-0.5 text-sm text-ink-soft">{priority.arabic_name}</p>}
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{body}</p>
          </div>
        </div>
        <Button size="lg" onClick={onRetry} className="shrink-0">
          <Icon name="restart" size={17} /> Try the same target again
        </Button>
      </div>
    </Card>
  );
}
