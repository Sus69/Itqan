import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { analyzeTajweed, isInsufficientSpeech, type TajweedResult } from '@/lib/api';
import { TAJWEED_INFO_CHAPTERS, type TajweedChapter, type QuranExtract } from '@/lib/infoData';
import {
  loadCourseProgress,
  recordLessonCompletion,
  recordExtractPassed,
  isChapterUnlocked,
  type CourseProgressState,
} from '@/lib/courseState';
import { RecordingSession } from '@/components/RecordingSession';
import { SessionFeedback } from '@/components/SessionFeedback';
import { TargetAudio } from '@/components/TargetAudio';
import {
  Badge,
  Button,
  Card,
  InlineNotice,
  Modal,
  ProgressBar,
  StepRail,
  VisuallyHidden,
} from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/lib/authContext';
import { useServiceHealth } from '@/hooks/useServiceHealth';
import { isPass, overallScore, pickPriority, speechMatchesTarget } from '@/lib/feedback';
import { recordAttempt } from '@/lib/sessionLog';
import { cn } from '@/lib/cn';

type Stage = 'study' | 'recite';

const TOTAL_CHAPTERS = TAJWEED_INFO_CHAPTERS.length;

/** The Arabic text of an extract, as a stable retry target for the Mistake Bank. */
function retryRoute(extract: QuranExtract): string {
  const params = new URLSearchParams({ text: extract.text });
  if (extract.ruleTarget) params.set('rule', extract.ruleTarget);
  params.set('label', extractLabel(extract));
  return `/practice/session?${params.toString()}`;
}

function extractLabel(extract: QuranExtract): string {
  const surah =
    typeof extract.surah === 'number' ? `Surah ${extract.surah}` : String(extract.surah ?? 'Extract');
  return extract.ayah !== undefined ? `${surah} · Ayah ${extract.ayah}` : surah;
}

/**
 * A Tajweed chapter: study the rule, then prove it out loud.
 *
 * The page has exactly one forward action at any moment. Progress is only ever
 * recorded from an analysed recitation that matched the target — reading the
 * theory of a chapter that has exercises never marks it passed.
 */
export default function TajweedLessonPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { state: serviceState, recheck } = useServiceHealth();

  const [progress, setProgress] = useState<CourseProgressState>(() => loadCourseProgress());

  const chapter = useMemo<TajweedChapter>(
    () => TAJWEED_INFO_CHAPTERS.find((c) => c.id === chapterId) ?? TAJWEED_INFO_CHAPTERS[0],
    [chapterId],
  );

  const currentIndex = TAJWEED_INFO_CHAPTERS.findIndex((c) => c.id === chapter.id);
  const prevChapter = TAJWEED_INFO_CHAPTERS[currentIndex - 1];
  const nextChapter = TAJWEED_INFO_CHAPTERS[currentIndex + 1];
  const unlocked = isChapterUnlocked(chapter.id, progress);

  const allExtracts = useMemo<QuranExtract[]>(
    () => chapter.subChapters.flatMap((sub) => sub.examples ?? []),
    [chapter],
  );
  const hasExtracts = allExtracts.length > 0;

  const [stage, setStage] = useState<Stage>('study');
  const [activeIdx, setActiveIdx] = useState(0);
  const extract = allExtracts[activeIdx] ?? null;

  const passedIds = progress.passedExtractIdsByChapter[chapter.id] ?? [];
  const passedCount = passedIds.length;
  const isCompleted = progress.completedChapterIds.includes(chapter.id);
  const bestScore = progress.chapterScores[chapter.id];
  const allPassed = hasExtracts && passedCount >= allExtracts.length;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechWarning, setSpeechWarning] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [result, setResult] = useState<TajweedResult | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const clearAttemptState = () => {
    setResult(null);
    setError(null);
    setSpeechWarning(null);
    setMismatch(false);
  };

  const goToChapter = (id: string) => {
    navigate(`/learn/tajweed/lesson/${id}`);
    setStage('study');
    setActiveIdx(0);
    clearAttemptState();
  };

  const handleRecording = useCallback(
    async (blob: Blob, fileName: string) => {
      if (!extract) return;
      setBusy(true);
      setError(null);
      setSpeechWarning(null);
      setMismatch(false);

      try {
        const res = await analyzeTajweed(blob, extract.text, fileName, token ?? undefined);
        if (isInsufficientSpeech(res)) {
          setSpeechWarning(res.details || res.message);
          setResult(null);
          return;
        }

        const score = overallScore(res);
        const matched = speechMatchesTarget(res);
        const priority = pickPriority(res.evaluations);
        const persisted = Boolean(token) && !token?.startsWith('demo_token_');

        recordAttempt({
          source: 'tajweed-lesson',
          targetLabel: `${chapter.title} · ${extractLabel(extract)}`,
          targetText: extract.text,
          retryTo: retryRoute(extract),
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
        setMismatch(!matched);

        // Progress is credited only for a take that both matched the target and
        // cleared the pass mark.
        if (matched && isPass(score)) {
          const { state, chapterNewlyCompleted } = recordExtractPassed(
            chapter.id,
            extract.id,
            score,
            allExtracts.length,
          );
          setProgress(state);
          if (chapterNewlyCompleted) setCelebrate(true);
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'The analysis service could not be reached, so this take was not scored.',
        );
      } finally {
        setBusy(false);
      }
    },
    [allExtracts.length, chapter.id, chapter.title, extract, token],
  );

  /** Theory-only chapters have nothing to measure, so nothing is scored. */
  const markTheoryRead = () => {
    setProgress(recordLessonCompletion(chapter.id, 0));
    if (nextChapter) goToChapter(nextChapter.id);
    else navigate('/learn/tajweed');
  };

  if (!unlocked) {
    return (
      <div className="anim-fade-up mx-auto max-w-focus py-8">
        <Card className="space-y-6 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-sand-100 text-sand-600">
            <Icon name="lock" size={30} />
          </span>
          <div className="space-y-2">
            <Badge tone="neutral">Not open yet</Badge>
            <h1 className="text-xl font-extrabold text-ink sm:text-2xl">
              Chapter {chapter.chapterNumber}: {chapter.title}
            </h1>
            <p className="arabic-text text-lg text-brand-800" dir="rtl" lang="ar">
              {chapter.arabicTitle}
            </p>
            <p className="mx-auto max-w-md pt-1 text-sm leading-relaxed text-ink-soft">
              Chapters open in order. Finish{' '}
              {prevChapter ? prevChapter.title : `chapter ${chapter.chapterNumber - 1}`} and this one
              becomes available.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {prevChapter && (
              <Button size="lg" onClick={() => goToChapter(prevChapter.id)}>
                Go to {prevChapter.title} <Icon name="arrowRight" size={16} />
              </Button>
            )}
            <Link to="/learn/tajweed">
              <Button variant="outline" size="lg">
                Course syllabus
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const railSteps = hasExtracts
    ? [
        { id: 'study', label: 'Study the rule' },
        { id: 'recite', label: `Recite (${passedCount}/${allExtracts.length})` },
        { id: 'done', label: 'Chapter passed' },
      ]
    : [
        { id: 'study', label: 'Study the rule' },
        { id: 'done', label: 'Marked as read' },
      ];
  const railCurrent = isCompleted && stage === 'study' ? 'done' : allPassed ? 'done' : stage;

  return (
    <div className="anim-fade-up mx-auto max-w-focus space-y-5">
      {/* One navigation cluster: where you are, and one step either side. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/learn/tajweed"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-faint transition-colors hover:text-brand-700"
        >
          <Icon name="arrowLeft" size={14} /> Tajweed syllabus
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={!prevChapter}
            onClick={() => prevChapter && goToChapter(prevChapter.id)}
          >
            <Icon name="arrowLeft" size={14} /> Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!nextChapter || !(isCompleted || allPassed)}
            onClick={() => nextChapter && goToChapter(nextChapter.id)}
          >
            Next <Icon name="arrowRight" size={14} />
          </Button>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">
            Chapter {chapter.chapterNumber} of {TOTAL_CHAPTERS}
          </Badge>
          {isCompleted && (
            <Badge tone="success">
              <Icon name="check" size={12} />
              {hasExtracts && typeof bestScore === 'number' ? `Passed · ${bestScore}` : 'Read'}
            </Badge>
          )}
          {!isCompleted && hasExtracts && (
            <Badge tone="neutral">
              {passedCount} of {allExtracts.length} exercises passed
            </Badge>
          )}
          {!hasExtracts && <Badge tone="neutral">Foundational concept</Badge>}
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            {chapter.title}
          </h1>
          <span className="arabic-text text-xl font-bold text-brand-800" dir="rtl" lang="ar">
            {chapter.arabicTitle}
          </span>
        </div>
      </div>

      <StepRail steps={railSteps} currentId={railCurrent} />

      {/* ---------------- Stage: study ---------------- */}
      {stage === 'study' && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-ink">What this chapter covers</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{chapter.summary}</p>
          </div>

          <div className="space-y-6">
            {chapter.subChapters.map((sub) => (
              <section
                key={sub.id}
                className="space-y-4 rounded-2xl border border-border bg-surface-1 p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-bold text-ink">{sub.title}</h3>
                  {sub.arabicTitle && (
                    <span className="arabic-text text-lg font-semibold text-brand-700" dir="rtl" lang="ar">
                      {sub.arabicTitle}
                    </span>
                  )}
                </div>

                {sub.description && (
                  <p className="text-sm leading-relaxed text-ink-soft">{sub.description}</p>
                )}

                {(sub.mnemonic || sub.duration) && (
                  <div className="flex flex-wrap gap-2">
                    {sub.mnemonic && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-gold-200 bg-gold-50 px-3 py-1.5 text-xs font-bold text-gold-900">
                        <Icon name="sparkle" size={13} className="text-gold-600" />
                        {sub.mnemonic}
                      </span>
                    )}
                    {sub.duration && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-800">
                        <Icon name="practice" size={13} className="text-brand-600" />
                        Held for {sub.duration}
                      </span>
                    )}
                  </div>
                )}

                {sub.extraNotes && sub.extraNotes.length > 0 && (
                  <ul className="space-y-2 rounded-xl border border-border bg-surface p-4 text-xs leading-relaxed text-ink-soft">
                    {sub.extraNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-600" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {sub.urduNote && (
                  <div className="rounded-xl border border-sand-300 bg-sand-50 p-4 text-right" dir="rtl">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-sand-700">
                      Urdu explanation (اردو وضاحت)
                    </span>
                    <p className="arabic-text text-sm font-semibold text-ink">{sub.urduNote}</p>
                  </div>
                )}

                {sub.makhaarijRows && sub.makhaarijRows.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                    <table className="w-full text-left text-xs">
                      <caption className="sr-only">
                        Articulation points covered by {sub.title}
                      </caption>
                      <thead className="border-b border-border bg-surface-2 font-bold uppercase tracking-wider text-ink-faint">
                        <tr>
                          <th scope="col" className="px-4 py-3">Group</th>
                          <th scope="col" className="px-4 py-3">Letters</th>
                          <th scope="col" className="px-4 py-3">Place of origin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sub.makhaarijRows.map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-bold text-ink">{row.group}</td>
                            <td className="arabic-text px-4 py-3 text-base font-bold text-brand-700" dir="rtl" lang="ar">
                              {row.letters}
                            </td>
                            <td className="px-4 py-3 text-ink-soft">{row.origin}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {sub.ruleLetters && sub.ruleLetters.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs font-bold text-ink-faint">Letters affected:</span>
                    {sub.ruleLetters.map((letter) => (
                      <span
                        key={letter}
                        className="arabic-text inline-grid size-9 place-items-center rounded-xl border border-brand-200 bg-brand-100 text-lg font-extrabold text-brand-800"
                        dir="rtl"
                        lang="ar"
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* The single forward action for this stage. */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
            {hasExtracts ? (
              <>
                <p className="max-w-prose text-xs leading-relaxed text-ink-faint">
                  {allPassed
                    ? 'You have already recited every exercise in this chapter.'
                    : `Next: recite ${allExtracts.length} short extract${allExtracts.length === 1 ? '' : 's'} so the engine can check this rule in your own voice.`}
                </p>
                <Button size="lg" onClick={() => setStage('recite')}>
                  <Icon name="mic" size={17} />
                  {allPassed ? 'Recite again' : `Start reciting (${allExtracts.length})`}
                </Button>
              </>
            ) : (
              <>
                <p className="max-w-prose text-xs leading-relaxed text-ink-faint">
                  This chapter is reference material with nothing to recite, so no score is recorded
                  for it. Marking it read opens the next chapter.
                </p>
                <Button size="lg" onClick={markTheoryRead}>
                  <Icon name="check" size={17} /> Mark as read and continue
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {/* ---------------- Stage: recite ---------------- */}
      {stage === 'recite' && hasExtracts && extract && (
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-ink">
                  Exercise {activeIdx + 1} of {allExtracts.length}
                </h2>
                <p className="text-xs text-ink-faint">
                  Every exercise must be recited and passed to complete the chapter.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStage('study')}>
                <Icon name="book" size={14} /> Back to the rule
              </Button>
            </div>

            <ProgressBar value={(passedCount / allExtracts.length) * 100} />

            <ol className="flex flex-wrap gap-2">
              {allExtracts.map((ex, idx) => {
                const done = passedIds.includes(ex.id);
                const active = idx === activeIdx;
                return (
                  <li key={ex.id}>
                    <button
                      type="button"
                      aria-current={active ? 'true' : undefined}
                      onClick={() => {
                        setActiveIdx(idx);
                        clearAttemptState();
                      }}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors',
                        active
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : done
                            ? 'border-success/30 bg-success-soft text-success'
                            : 'border-border bg-surface-2 text-ink-soft hover:border-brand-300',
                      )}
                    >
                      <span className="tabular-nums">{idx + 1}</span>
                      {done && (
                        <>
                          <Icon name="check" size={12} />
                          <VisuallyHidden>passed</VisuallyHidden>
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-ink">{extractLabel(extract)}</h3>
              <div className="flex flex-wrap items-center gap-2">
                {extract.ruleTarget && <Badge tone="brand">Focus: {extract.ruleTarget}</Badge>}
                {passedIds.includes(extract.id) && (
                  <Badge tone="success">
                    <Icon name="check" size={12} /> Passed
                  </Badge>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-brand-900 via-brand-850 to-brand-800 p-6 text-center sm:p-8">
              <p className="quran-text quran-lg select-none text-white" dir="rtl" lang="ar">
                {extract.text}
              </p>
            </div>

            <TargetAudio text={extract.text} label="Hear this extract" />

            <RecordingSession
              onSubmit={handleRecording}
              busy={busy}
              busyLabel="Checking this rule in your recitation"
              resetKey={extract.id}
              serviceAvailable={serviceState !== 'unavailable'}
              onRetryService={recheck}
              guidance="Recite just this extract. You will hear your take before it is sent."
            />

            {speechWarning && (
              <InlineNotice tone="warning" title="No clear recitation was detected" live>
                {speechWarning} Nothing was scored, so this take does not count against you — move
                closer to the microphone and record again.
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

            {mismatch && (
              <InlineNotice tone="warning" title="That did not match this extract" live>
                The engine analysed your audio but could not line it up with the words above, so the
                exercise has not been marked passed. Check you are reciting the highlighted extract
                and try again.
              </InlineNotice>
            )}
          </Card>

          {result && (
            <SessionFeedback
              score={overallScore(result)}
              evaluations={result.evaluations}
              alignment={result.alignment}
              targetText={extract.text}
              onRetry={clearAttemptState}
              retryLabel="Recite this extract again"
              storageNote={
                token && !token.startsWith('demo_token_')
                  ? 'Saved to your account and to this device.'
                  : 'Saved on this device only. Sign in to keep your history across devices.'
              }
              nextAction={
                passedIds.includes(extract.id) ? (
                  activeIdx < allExtracts.length - 1 ? (
                    <Button
                      size="lg"
                      onClick={() => {
                        setActiveIdx((i) => i + 1);
                        clearAttemptState();
                      }}
                    >
                      Next exercise ({activeIdx + 2} of {allExtracts.length}){' '}
                      <Icon name="arrowRight" size={16} />
                    </Button>
                  ) : nextChapter && allPassed ? (
                    <Button size="lg" onClick={() => goToChapter(nextChapter.id)}>
                      Continue to {nextChapter.title} <Icon name="arrowRight" size={16} />
                    </Button>
                  ) : (
                    <Link to="/learn/tajweed">
                      <Button size="lg">
                        Back to the syllabus <Icon name="arrowRight" size={16} />
                      </Button>
                    </Link>
                  )
                ) : (
                  <Link to="/practice/review">
                    <Button variant="outline">
                      <Icon name="note" size={16} /> Add to focused review
                    </Button>
                  </Link>
                )
              }
            />
          )}
        </div>
      )}

      <Modal
        open={celebrate}
        onClose={() => setCelebrate(false)}
        title={`Chapter ${chapter.chapterNumber} complete`}
        description={`You recited and passed all ${allExtracts.length} exercise${allExtracts.length === 1 ? '' : 's'} in ${chapter.title}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCelebrate(false)}>
              Stay here
            </Button>
            {nextChapter ? (
              <Button
                onClick={() => {
                  setCelebrate(false);
                  goToChapter(nextChapter.id);
                }}
              >
                Continue to {nextChapter.title} <Icon name="arrowRight" size={16} />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setCelebrate(false);
                  navigate('/learn/tajweed');
                }}
              >
                Back to the syllabus
              </Button>
            )}
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          Your chapter score is the average of those exercises. Anything the engine flagged along the
          way is waiting in focused review.
        </p>
      </Modal>
    </div>
  );
}
