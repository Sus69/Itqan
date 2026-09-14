import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  clearAttempts,
  loadAttempts,
  weakRules,
  type AttemptRecord,
  type WeakRule,
} from '@/lib/sessionLog';
import { Badge, Button, Card, EmptyState, InlineNotice, Modal, SectionHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { relativeTime } from '@/lib/format';
import { PASS_THRESHOLD } from '@/lib/feedback';

/**
 * Focused review — the Mistake Bank.
 *
 * Everything on this page comes from attempts the learner actually recorded on
 * this device. There is no synthesised mastery figure and no placeholder rule
 * list: if nothing has been analysed yet, the page says so and offers the one
 * action that would populate it.
 */
export default function PracticeReviewPage() {
  const [attempts, setAttempts] = useState<AttemptRecord[] | null>(null);
  const [rules, setRules] = useState<WeakRule[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = useCallback(() => {
    const records = loadAttempts();
    setAttempts(records);
    setRules(weakRules(records));
  }, []);

  useEffect(refresh, [refresh]);

  const handleClear = () => {
    clearAttempts();
    setConfirmClear(false);
    refresh();
  };

  const loading = attempts === null;
  const recent = (attempts ?? []).slice(0, 8);

  return (
    <div className="anim-fade-up mx-auto max-w-focus space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Focused review</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          What to work on next
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
          Each entry is a rule that the engine asked you to review, on a target you recited. Reciting
          that same target cleanly removes it from this list.
        </p>
      </div>

      {!loading && (attempts?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Icon name="mic" size={28} />}
          title="Nothing to review yet"
          body="Record one target in a practice session and any rule you need to revisit will be collected here."
          action={
            <Link to="/practice/session">
              <Button variant="primary">
                <Icon name="mic" size={16} /> Start a practice session
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <section>
            <SectionHeader
              title="Rules to revisit"
              subtitle={
                rules.length === 0
                  ? 'Nothing outstanding — your most recent attempt on each target came back clean.'
                  : `${rules.length} outstanding, most frequent first`
              }
            />

            {rules.length === 0 ? (
              <InlineNotice tone="success" title="Nothing outstanding right now">
                Every target you have recorded came back without a priority correction on its latest
                attempt. Add a new target to keep going.
              </InlineNotice>
            ) : (
              <ul className="space-y-3">
                {rules.map((rule) => (
                  <li key={rule.ruleId}>
                    <Card className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-ink">{rule.ruleName}</h3>
                          <Badge tone={rule.occurrences > 1 ? 'warning' : 'neutral'}>
                            {rule.occurrences === 1
                              ? 'Flagged once'
                              : `Flagged ${rule.occurrences} times`}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-ink-faint">
                          {rule.targetLabel} · {relativeTime(rule.lastAt)}
                        </p>
                        <p
                          className="quran-text quran-sm mt-2 line-clamp-2 text-ink"
                          dir="rtl"
                          lang="ar"
                        >
                          {rule.targetText}
                        </p>
                      </div>
                      <Link to={rule.retryTo} className="shrink-0">
                        <Button variant="primary" size="sm">
                          <Icon name="mic" size={14} /> Recite this target
                        </Button>
                      </Link>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <SectionHeader
              title="Recent attempts"
              subtitle="Stored on this device. Scores come from the analysis engine, not an estimate."
              action={
                (attempts?.length ?? 0) > 0 ? (
                  <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
                    Clear history
                  </Button>
                ) : undefined
              }
            />

            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {recent.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold tabular-nums ${
                      a.score >= 85
                        ? 'bg-success-soft text-success'
                        : a.score >= PASS_THRESHOLD
                          ? 'bg-warning-soft text-warning'
                          : 'bg-error-soft text-error'
                    }`}
                  >
                    {a.score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{a.targetLabel}</p>
                    <p className="text-xs text-ink-faint">
                      {relativeTime(a.at)} · {a.passedRules} passed
                      {a.reviewRules > 0 && ` · ${a.reviewRules} to review`}
                      {!a.synced && ' · this device only'}
                    </p>
                  </div>
                  <Link to={a.retryTo} className="shrink-0">
                    <Button variant="outline" size="sm">
                      <Icon name="restart" size={14} /> Retry
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear your attempt history?"
        description="This removes every locally stored attempt and empties the list above. Attempts already saved to your account are not affected."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Keep history
            </Button>
            <Button variant="danger" onClick={handleClear}>
              Clear history
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          {attempts?.length ?? 0} attempt{(attempts?.length ?? 0) === 1 ? '' : 's'} will be deleted
          from this device. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
