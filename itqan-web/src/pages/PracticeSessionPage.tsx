import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { analyzeTajweed, isInsufficientSpeech, type TajweedResult } from '@/lib/api';
import { VERSES, findVerseByIdOrText, type PracticeVerse } from '@/lib/verses';
import { RecordingSession } from '@/components/RecordingSession';
import { SessionFeedback } from '@/components/SessionFeedback';
import { TargetAudio } from '@/components/TargetAudio';
import { Badge, Button, Card, Drawer, InlineNotice, StepRail } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/lib/authContext';
import { useServiceHealth } from '@/hooks/useServiceHealth';
import { overallScore, pickPriority } from '@/lib/feedback';
import { recordAttempt } from '@/lib/sessionLog';
import { cn } from '@/lib/cn';

type Step = 'target' | 'record' | 'feedback';
type DifficultyFilter = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';

const STEPS = [
  { id: 'target', label: 'Target' },
  { id: 'record', label: 'Record' },
  { id: 'feedback', label: 'Feedback' },
];

/**
 * The open practice session.
 *
 * One target occupies the viewport. The catalogue of other verses lives in a
 * drawer, because choosing what to recite is a rare act and reciting is the
 * frequent one — the old side-by-side layout gave both equal weight.
 *
 * Accepts `?verse=<id>` or `?text=<arabic>` so any surface (Insights, the
 * Mistake Bank, a lesson) can hand this page an exact target and have the retry
 * land on the same words.
 */
export default function PracticeSessionPage() {
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const { state: serviceState, recheck } = useServiceHealth();

  const verseParam = searchParams.get('verse');
  // `extractText` is the parameter the Tajweed lessons used before the rename.
  const textParam = searchParams.get('text') ?? searchParams.get('extractText');
  const labelParam = searchParams.get('label');
  const ruleParam = searchParams.get('rule');

  const requestedVerse = useMemo<PracticeVerse>(() => {
    const known = findVerseByIdOrText(verseParam || textParam);
    if (known) return known;
    if (textParam) {
      return {
        id: 'custom-target',
        surah: labelParam || 'Saved target',
        ayah: 'Extract',
        arabicName: 'مقتطف',
        text: textParam,
        focusRules: ruleParam ? [ruleParam] : [],
        difficulty: 'Intermediate',
      };
    }
    return VERSES[0];
  }, [verseParam, textParam, labelParam, ruleParam]);

  const [verse, setVerse] = useState<PracticeVerse>(requestedVerse);
  const [step, setStep] = useState<Step>('record');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('All');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechWarning, setSpeechWarning] = useState<string | null>(null);
  const [result, setResult] = useState<TajweedResult | null>(null);
  const [savedTo, setSavedTo] = useState<'account' | 'device'>('device');

  // A target arriving in the URL replaces whatever is on screen.
  useEffect(() => {
    setVerse(requestedVerse);
    setResult(null);
    setError(null);
    setSpeechWarning(null);
    setStep('record');
  }, [requestedVerse]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VERSES.filter((v) => {
      if (difficulty !== 'All' && v.difficulty !== difficulty) return false;
      if (!q) return true;
      return (
        v.surah.toLowerCase().includes(q) ||
        v.ayah.toLowerCase().includes(q) ||
        v.text.includes(q) ||
        v.focusRules.some((r) => r.toLowerCase().includes(q))
      );
    });
  }, [difficulty, query]);

  const chooseVerse = (next: PracticeVerse) => {
    setVerse(next);
    setResult(null);
    setError(null);
    setSpeechWarning(null);
    setStep('record');
    setPickerOpen(false);
  };

  const handleSubmit = useCallback(
    async (blob: Blob, fileName: string) => {
      setBusy(true);
      setError(null);
      setSpeechWarning(null);
      try {
        // Passing the token is what makes the attempt appear in Insights on
        // every device; without it the analysis is computed and thrown away.
        const res = await analyzeTajweed(blob, verse.text, fileName, token ?? undefined);
        if (isInsufficientSpeech(res)) {
          setSpeechWarning(res.details || res.message);
          setResult(null);
          return;
        }

        const score = overallScore(res);
        const priority = pickPriority(res.evaluations);
        const persisted = Boolean(token) && !token?.startsWith('demo_token_');
        setSavedTo(persisted ? 'account' : 'device');

        recordAttempt({
          source: 'practice',
          targetLabel: `${verse.surah} · ${verse.ayah}`,
          targetText: verse.text,
          retryTo: `/practice/session?verse=${encodeURIComponent(verse.id)}`,
          score,
          passedRules: res.evaluations.filter((e) => e.status === 'passed').length,
          reviewRules: res.evaluations.filter(
            (e) => e.applicable && (e.status === 'failed' || e.status === 'needs_review'),
          ).length,
          priorityRuleId: priority?.ruleId ?? null,
          priorityRuleName: priority?.ruleName ?? null,
          synced: persisted,
        });

        setResult(res);
        setStep('feedback');
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'The analysis service could not be reached. Your recording was not sent anywhere.',
        );
      } finally {
        setBusy(false);
      }
    },
    [token, verse],
  );

  const retrySameTarget = () => {
    setResult(null);
    setSpeechWarning(null);
    setError(null);
    setStep('record');
  };

  return (
    <div className="anim-fade-up mx-auto max-w-focus space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Practice session</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            One target, one correction
          </h1>
        </div>
        <Button variant="outline" onClick={() => setPickerOpen(true)}>
          <Icon name="search" size={16} /> Change target
        </Button>
      </div>

      <StepRail steps={STEPS} currentId={step} />

      {/* The target itself — the only thing competing for attention here. */}
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-100/80">
                Your target
              </p>
              <p className="mt-1 text-lg font-bold">
                {verse.surah} · {verse.ayah}
              </p>
            </div>
            <span className="arabic-text text-base text-gold-300" dir="rtl" lang="ar">
              {verse.arabicName}
            </span>
          </div>

          <p className="quran-text quran-lg mt-6 text-center text-white" dir="rtl" lang="ar">
            {verse.text}
          </p>

          {verse.focusRules.length > 0 && (
            <div className="mt-6 border-t border-white/15 pt-4">
              <p className="mb-2 text-center text-[11px] font-extrabold uppercase tracking-wider text-gold-300">
                Rules that apply here
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {verse.focusRules.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-white"
                  >
                    <span className="size-1.5 rounded-full bg-gold-400" aria-hidden="true" />
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <TargetAudio text={verse.text} label="Hear the target" />

          <RecordingSession
            onSubmit={handleSubmit}
            busy={busy}
            resetKey={verse.id}
            serviceAvailable={serviceState !== 'unavailable'}
            onRetryService={recheck}
            guidance="Recite the whole target at your natural pace. You will hear your take before it is analysed."
          />

          {speechWarning && (
            <InlineNotice tone="warning" title="No clear recitation was detected" live>
              {speechWarning} Move closer to the microphone, find a quieter spot, and record again —
              nothing was scored, so this attempt is not counted against you.
            </InlineNotice>
          )}

          {error && (
            <InlineNotice
              tone="error"
              title="That take could not be analysed"
              action={
                <Button variant="secondary" size="sm" onClick={recheck}>
                  <Icon name="restart" size={14} /> Check the service
                </Button>
              }
            >
              {error}
            </InlineNotice>
          )}
        </div>
      </Card>

      {step === 'feedback' && result && (
        <SessionFeedback
          score={overallScore(result)}
          evaluations={result.evaluations}
          alignment={result.alignment}
          targetText={verse.text}
          onRetry={retrySameTarget}
          storageNote={
            savedTo === 'account'
              ? 'Saved to your account — it will appear in Insights on any device.'
              : 'Saved on this device only. Sign in to keep your history across devices.'
          }
          nextAction={
            <>
              <Button variant="secondary" onClick={() => setPickerOpen(true)}>
                <Icon name="search" size={16} /> Choose another target
              </Button>
              <Link to="/practice/review">
                <Button variant="outline">
                  <Icon name="progress" size={16} /> Go to focused review
                </Button>
              </Link>
            </>
          }
        />
      )}

      {/* The catalogue: present when asked for, absent otherwise. */}
      <Drawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choose a practice target"
        description={`${filtered.length} of ${VERSES.length} shown`}
      >
        <div className="space-y-4">
          <div className="relative">
            <label className="sr-only" htmlFor="target-search">
              Search targets
            </label>
            <input
              id="target-search"
              type="search"
              placeholder="Search Surah, Ayah or rule"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Icon
              name="search"
              size={15}
              className="pointer-events-none absolute left-3 top-3 text-ink-faint"
            />
          </div>

          <div role="group" aria-label="Filter by difficulty" className="flex flex-wrap gap-1.5">
            {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                aria-pressed={difficulty === d}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors',
                  difficulty === d
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-2 text-ink-soft hover:bg-brand-50 hover:text-ink',
                )}
              >
                {d}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-ink-soft">
              Nothing matches that search. Clear the filters to see every target.
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => chooseVerse(v)}
                    aria-current={v.id === verse.id ? 'true' : undefined}
                    className={cn(
                      'w-full rounded-xl border px-3.5 py-3 text-left transition-colors',
                      v.id === verse.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-border bg-surface hover:border-brand-300 hover:bg-brand-50/40',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-bold text-ink">
                        {v.surah} · {v.ayah}
                      </span>
                      <Badge
                        tone={
                          v.difficulty === 'Beginner'
                            ? 'gold'
                            : v.difficulty === 'Intermediate'
                              ? 'brand'
                              : 'neutral'
                        }
                        className="shrink-0 px-2 py-0.5 text-[10px]"
                      >
                        {v.difficulty}
                      </Badge>
                    </span>
                    <span
                      className="quran-text quran-sm mt-1 block truncate text-right text-ink"
                      dir="rtl"
                      lang="ar"
                    >
                      {v.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Drawer>
    </div>
  );
}
