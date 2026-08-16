import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { analyzeTajweed, isInsufficientSpeech, type TajweedResult } from '@/lib/api';
import {
  TAJWEED_INFO_CHAPTERS,
  type TajweedChapter,
  type QuranExtract,
} from '@/lib/infoData';
import {
  loadCourseProgress,
  recordLessonCompletion,
  recordExtractPassed,
  isChapterUnlocked,
  type CourseProgressState,
} from '@/lib/courseState';
import { RecorderPanel } from '@/components/RecorderPanel';
import { RuleEvaluationCard } from '@/components/RuleEvaluationCard';
import { Badge, Button, Card, ProgressBar, ScoreRing, SectionHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';

type LessonTab = 'theory' | 'practice';

export default function TajweedLessonPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();

  const [progress, setProgress] = useState<CourseProgressState>(() => loadCourseProgress());

  // Find target chapter
  const chapter = useMemo<TajweedChapter>(() => {
    const found = TAJWEED_INFO_CHAPTERS.find((c) => c.id === chapterId);
    return found || TAJWEED_INFO_CHAPTERS[0];
  }, [chapterId]);

  const currentIndex = TAJWEED_INFO_CHAPTERS.findIndex((c) => c.id === chapter.id);
  const prevChapter = TAJWEED_INFO_CHAPTERS[currentIndex - 1];
  const nextChapter = TAJWEED_INFO_CHAPTERS[currentIndex + 1];

  const unlocked = isChapterUnlocked(chapter.id, progress);

  // Collect all practice extracts for this chapter
  const allExtracts = useMemo<QuranExtract[]>(() => {
    const list: QuranExtract[] = [];
    for (const sub of chapter.subChapters) {
      if (sub.examples) list.push(...sub.examples);
    }
    return list;
  }, [chapter]);

  const hasExtracts = allExtracts.length > 0;

  // Active Tab
  const [activeTab, setActiveTab] = useState<LessonTab>('theory');

  // Active Exercise Index
  const [activeExtractIdx, setActiveExtractIdx] = useState(0);
  const selectedExtract = allExtracts[activeExtractIdx] || null;

  // Passed extracts for this chapter
  const passedExtractIds = progress.passedExtractIdsByChapter[chapter.id] || [];
  const passedCount = passedExtractIds.length;
  const isCompleted = progress.completedChapterIds.includes(chapter.id);
  const bestScore = progress.chapterScores[chapter.id];

  // AI Evaluation State
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechWarning, setSpeechWarning] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TajweedResult | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Applicable rules for current test result
  const applicableRules = useMemo(
    () => testResult?.evaluations.filter((e) => e.applicable && e.status !== 'not_applicable') ?? [],
    [testResult],
  );

  const avgRuleScore = useMemo(() => {
    if (!applicableRules.length) return 85;
    const scores = applicableRules.map((e) => e.confidence_score ?? 80);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [applicableRules]);

  // Check if speech actually matches the target verse (prevents random gibberish or noise from passing)
  const isSpeechMatching = useMemo(() => {
    if (!testResult) return false;
    const sim = testResult.phrase_verification.similarity_percentage;
    const charAcc = testResult.phrase_verification.character_accuracy_percentage;
    return (sim >= 35.0 && charAcc >= 40.0) || sim >= 50.0 || charAcc >= 65.0;
  }, [testResult]);

  // Overall Score & Pass determination
  const overallScore = useMemo(() => {
    if (!testResult) return 0;
    const charAcc = testResult.phrase_verification.character_accuracy_percentage;
    const sim = testResult.phrase_verification.similarity_percentage;
    const alignConf = testResult.alignment_confidence;

    if (!isSpeechMatching) {
      // Audio was gibberish, wrong language, or ambient noise
      return Math.round(sim * 0.5 + charAcc * 0.5);
    }

    const weightedScore = Math.max(
      avgRuleScore,
      Math.round(charAcc * 0.5 + alignConf * 0.5),
      Math.round(sim * 0.3 + charAcc * 0.4 + alignConf * 0.3),
    );
    return Math.min(100, Math.max(0, weightedScore));
  }, [testResult, avgRuleScore, isSpeechMatching]);

  const isExercisePassed = useMemo(() => {
    if (!testResult || !isSpeechMatching) return false;
    return (
      overallScore >= 60 ||
      applicableRules.some((e) => (e.confidence_score ?? 0) >= 90 || e.status === 'passed')
    );
  }, [testResult, overallScore, applicableRules, isSpeechMatching]);

  // Handle Recording Submission for an Exercise
  const handleRecordExercise = async (blob: Blob, fileName: string) => {
    if (!selectedExtract) return;
    setBusy(true);
    setError(null);
    setSpeechWarning(null);

    try {
      const res = await analyzeTajweed(blob, selectedExtract.text, fileName);
      if (isInsufficientSpeech(res)) {
        setSpeechWarning(
          'We could not detect clear recitation in that audio. Find a quieter space, move closer to the mic, and try again.',
        );
        setTestResult(null);
      } else {
        setTestResult(res);

        const sim = res.phrase_verification.similarity_percentage;
        const charAcc = res.phrase_verification.character_accuracy_percentage;
        const speechMatches = (sim >= 35.0 && charAcc >= 40.0) || sim >= 50.0 || charAcc >= 65.0;

        if (speechMatches) {
          const rules = res.evaluations.filter((e) => e.applicable && e.status !== 'not_applicable');
          const ruleScores = rules.map((e) => e.confidence_score ?? 80);
          const ruleAvg = ruleScores.length > 0 ? Math.round(ruleScores.reduce((a, b) => a + b, 0) / ruleScores.length) : 85;

          const effectiveScore = Math.max(
            ruleAvg,
            Math.round(charAcc * 0.5 + res.alignment_confidence * 0.5),
            Math.round(sim * 0.3 + charAcc * 0.4 + res.alignment_confidence * 0.3),
          );

          const passed = effectiveScore >= 60 || rules.some((e) => (e.confidence_score ?? 0) >= 90 || e.status === 'passed');

          if (passed) {
            const finalScore = Math.max(60, effectiveScore);
            const { state: updatedState, chapterNewlyCompleted } = recordExtractPassed(
              chapter.id,
              selectedExtract.id,
              finalScore,
              allExtracts.length,
            );
            setProgress(updatedState);
            if (chapterNewlyCompleted || (updatedState.passedExtractIdsByChapter[chapter.id] || []).length >= allExtracts.length) {
              setShowCompletionModal(true);
            }
          }
        }
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Analysis failed. Ensure the backend server is running on port 8000.',
      );
    } finally {
      setBusy(false);
    }
  };

  // Handler to complete theoretical lessons with no practice extracts
  const handleCompleteTheoryOnly = () => {
    const updated = recordLessonCompletion(chapter.id, 100);
    setProgress(updated);
    if (nextChapter) {
      navigate(`/learn/tajweed/lesson/${nextChapter.id}`);
      setActiveTab('theory');
      setTestResult(null);
    } else {
      navigate('/learn/tajweed');
    }
  };

  // If chapter is locked, show lock screen
  if (!unlocked) {
    return (
      <div className="space-y-6 anim-fade-up max-w-2xl mx-auto py-12 text-center">
        <Card className="p-8 space-y-6 border-sand-300 bg-surface shadow-md">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-sand-100 text-sand-600 shadow-inner">
            <Icon name="lock" size={36} />
          </div>
          <div className="space-y-2">
            <Badge tone="neutral" className="bg-sand-200 text-sand-800 font-bold">
              Lesson Locked
            </Badge>
            <h1 className="text-2xl font-extrabold text-ink">
              Chapter {chapter.chapterNumber}: {chapter.title}
            </h1>
            <p className="arabic-text text-lg text-brand-800" dir="rtl">
              {chapter.arabicTitle}
            </p>
            <p className="text-sm text-ink-faint max-w-md mx-auto leading-relaxed pt-2">
              Complete the previous lesson ({prevChapter?.title || 'Chapter ' + (chapter.chapterNumber - 1)}) to unlock this chapter.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {prevChapter && (
              <Button
                size="lg"
                variant="primary"
                onClick={() => navigate(`/learn/tajweed/lesson/${prevChapter.id}`)}
                className="w-full sm:w-auto font-bold"
              >
                Go to Chapter {prevChapter.chapterNumber}: {prevChapter.title} ➔
              </Button>
            )}
            <Link to="/learn/tajweed" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full">
                Course Syllabus
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 anim-fade-up pb-24">
      {/* ----------------- Top Header & Navigation ----------------- */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/learn/tajweed"
              className="inline-flex items-center gap-1 text-xs font-bold text-ink-faint hover:text-brand-600 transition-colors"
            >
              <Icon name="arrowRight" size={14} className="rotate-180" /> Syllabus
            </Link>
            <span className="text-ink-faint">·</span>
            <Badge tone="brand">Chapter {chapter.chapterNumber} of 19</Badge>
            {isCompleted ? (
              <Badge tone="neutral" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                <Icon name="check" size={12} /> Passed ({bestScore}%)
              </Badge>
            ) : hasExtracts ? (
              <Badge tone="neutral" className="bg-sand-100 text-sand-800">
                {passedCount} of {allExtracts.length} Exercises Passed
              </Badge>
            ) : (
              <Badge tone="neutral" className="bg-brand-50 text-brand-700">
                Foundational Concept
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              {chapter.title}
            </h1>
            <span className="arabic-text text-xl font-bold text-brand-800" dir="rtl">
              {chapter.arabicTitle}
            </span>
          </div>
        </div>

        {/* Prev / Next Quick Nav */}
        <div className="flex items-center gap-2 shrink-0">
          {prevChapter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate(`/learn/tajweed/lesson/${prevChapter.id}`);
                setActiveTab('theory');
                setTestResult(null);
              }}
            >
              ← Prev
            </Button>
          )}
          {nextChapter && isCompleted && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigate(`/learn/tajweed/lesson/${nextChapter.id}`);
                setActiveTab('theory');
                setTestResult(null);
              }}
            >
              Next →
            </Button>
          )}
        </div>
      </div>

      {/* ----------------- Mode Switcher / Tab Bar ----------------- */}
      {hasExtracts ? (
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-2 p-1.5 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('theory')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-extrabold transition-all',
              activeTab === 'theory'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-ink-soft hover:bg-surface hover:text-ink',
            )}
          >
            <span>📖 1. Theory & Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-extrabold transition-all',
              activeTab === 'practice'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-ink-soft hover:bg-surface hover:text-ink',
            )}
          >
            <span>🎙️ 2. Practice Exercises ({passedCount}/{allExtracts.length})</span>
            {passedCount === allExtracts.length && <Icon name="check" size={14} className="text-emerald-400" />}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-brand-50/60 p-4 border border-brand-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-800">
            <Icon name="book" size={16} />
            <span>Foundational Theoretical Concept · Read and master the material below</span>
          </div>
        </div>
      )}

      {/* ----------------- TAB 1: THEORY ----------------- */}
      {activeTab === 'theory' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-ink">Lesson Objectives & Core Principles</h2>
              <p className="mt-1 text-sm text-ink-faint leading-relaxed">{chapter.summary}</p>
            </div>

            <div className="space-y-8">
              {chapter.subChapters.map((sub) => (
                <div key={sub.id} className="space-y-4 rounded-2xl bg-surface-2/60 p-5 sm:p-6 border border-border/80">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-bold text-ink sm:text-lg">{sub.title}</h3>
                    {sub.arabicTitle && (
                      <span className="arabic-text text-lg font-semibold text-brand-700" dir="rtl">
                        {sub.arabicTitle}
                      </span>
                    )}
                  </div>

                  {sub.description && (
                    <p className="text-sm leading-relaxed text-ink-soft">{sub.description}</p>
                  )}

                  {/* Mnemonics & Duration */}
                  <div className="flex flex-wrap gap-2">
                    {sub.mnemonic && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-gold-50 border border-gold-200 px-3.5 py-1.5 text-xs font-bold text-gold-900">
                        <Icon name="sparkle" size={13} className="text-gold-600" />
                        {sub.mnemonic}
                      </span>
                    )}
                    {sub.duration && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 border border-brand-200 px-3.5 py-1.5 text-xs font-bold text-brand-800">
                        <Icon name="practice" size={13} className="text-brand-600" />
                        Duration: {sub.duration}
                      </span>
                    )}
                  </div>

                  {/* Extra Notes */}
                  {sub.extraNotes && sub.extraNotes.length > 0 && (
                    <ul className="space-y-2 rounded-xl bg-surface p-4 border border-border text-xs leading-relaxed text-ink-soft">
                      {sub.extraNotes.map((note, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 size-1.5 rounded-full bg-brand-600 shrink-0" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Urdu Explanation */}
                  {sub.urduNote && (
                    <div className="rounded-xl border border-sand-300 bg-sand-50 p-4 text-right" dir="rtl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-sand-600 block mb-1">
                        Urdu Explanation (اردو وضاحت)
                      </span>
                      <p className="arabic-text text-sm font-semibold text-ink">{sub.urduNote}</p>
                    </div>
                  )}

                  {/* Makhaarij Table */}
                  {sub.makhaarijRows && sub.makhaarijRows.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border bg-surface-2 text-ink-faint font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Group</th>
                            <th className="px-4 py-3">Letters</th>
                            <th className="px-4 py-3">Place of Origin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {sub.makhaarijRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-sand-50/50">
                              <td className="px-4 py-3 font-bold text-ink">{row.group}</td>
                              <td className="arabic-text px-4 py-3 text-base font-bold text-brand-700" dir="rtl">
                                {row.letters}
                              </td>
                              <td className="px-4 py-3 text-ink-soft">{row.origin}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Target Letters */}
                  {sub.ruleLetters && sub.ruleLetters.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs font-bold text-ink-faint mr-2">Target Letters:</span>
                      {sub.ruleLetters.map((ltr) => (
                        <span
                          key={ltr}
                          className="arabic-text inline-grid size-9 place-items-center rounded-xl bg-brand-100 text-lg font-extrabold text-brand-800 border border-brand-200"
                          dir="rtl"
                        >
                          {ltr}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Action in Theory */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              {hasExtracts ? (
                <>
                  <p className="text-xs text-ink-faint">
                    Ready to practice? Complete all {allExtracts.length} exercises with the AI Checker to pass.
                  </p>
                  <Button size="lg" onClick={() => setActiveTab('practice')} className="font-bold w-full sm:w-auto">
                    Start {allExtracts.length} Practice Exercises ➔
                  </Button>
                </>
              ) : (
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-brand-50 p-5 border border-brand-200">
                  <div>
                    <h3 className="font-bold text-brand-900">Finished Reading Concept?</h3>
                    <p className="text-xs text-brand-700 mt-0.5">
                      Mark this foundational lesson as completed to unlock the next chapter.
                    </p>
                  </div>
                  <Button size="lg" variant="primary" onClick={handleCompleteTheoryOnly} className="font-bold shrink-0">
                    Complete & Move to Next Lesson ➔
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ----------------- TAB 2: INTERACTIVE PRACTICE EXERCISES ----------------- */}
      {activeTab === 'practice' && hasExtracts && selectedExtract && (
        <div className="space-y-6">
          {/* Progress Tracker Card */}
          <Card className="p-5 space-y-4 bg-surface">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-ink">
                  Chapter Exercises Progress: {passedCount} of {allExtracts.length} Completed
                </h2>
                <p className="text-xs text-ink-faint">
                  You must recite and pass every exercise in this chapter to unlock the next lesson.
                </p>
              </div>
              <span className="text-sm font-extrabold text-brand-700 tabular-nums">
                {Math.round((passedCount / allExtracts.length) * 100)}% Done
              </span>
            </div>

            <ProgressBar value={(passedCount / allExtracts.length) * 100} />

            {/* Stepper Pills for all extracts */}
            <div className="flex flex-wrap gap-2 pt-2">
              {allExtracts.map((ex, idx) => {
                const isPassed = passedExtractIds.includes(ex.id);
                const isActive = idx === activeExtractIdx;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      setActiveExtractIdx(idx);
                      setTestResult(null);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/30'
                        : isPassed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-surface-2 text-ink-soft border border-border hover:border-brand-300',
                    )}
                  >
                    <span>{idx + 1}</span>
                    {isPassed ? (
                      <Icon name="check" size={12} className="text-emerald-700" />
                    ) : (
                      ex.ruleTarget && <span className="opacity-75">({ex.ruleTarget})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Active Exercise Target Card */}
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-700">
                  Exercise {activeExtractIdx + 1} of {allExtracts.length}
                </span>
                <h3 className="text-base font-bold text-ink">
                  {typeof selectedExtract.surah === 'number' ? `Surah ${selectedExtract.surah}` : selectedExtract.surah}
                  {selectedExtract.ayah !== undefined && ` · Ayah ${selectedExtract.ayah}`}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {selectedExtract.ruleTarget && (
                  <Badge tone="brand" className="font-bold">
                    Focus: {selectedExtract.ruleTarget}
                  </Badge>
                )}
                {passedExtractIds.includes(selectedExtract.id) && (
                  <Badge tone="neutral" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                    <Icon name="check" size={12} /> Passed
                  </Badge>
                )}
              </div>
            </div>

            {/* Quranic Text */}
            <div className="rounded-3xl bg-gradient-to-br from-brand-900 via-brand-850 to-brand-800 p-6 sm:p-8 text-white text-center shadow-lg">
              <p
                className="quran-text leading-[2.6] text-white select-none"
                style={{ fontSize: 'clamp(1.6rem, 2.8vw + 0.6rem, 2.6rem)' }}
                dir="rtl"
                lang="ar"
              >
                {selectedExtract.text}
              </p>
            </div>

            {/* Recorder Section */}
            <div className="space-y-4">
              <RecorderPanel
                onRecorded={handleRecordExercise}
                busy={busy}
                busyLabel="Evaluating your recitation with Tajweed Engine…"
                hint="Recite into your microphone"
              />

              {(error || speechWarning) && (
                <p
                  className={cn(
                    'flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium',
                    error ? 'bg-error-soft text-error' : 'bg-warning-soft text-warning',
                  )}
                >
                  <Icon name={error ? 'alert' : 'info'} size={16} className="mt-0.5 shrink-0" />
                  <span>{error ?? speechWarning}</span>
                </p>
              )}
            </div>

            {/* Exercise Evaluation Feedback */}
            {testResult && (
              <div className="space-y-4 pt-4 border-t border-border anim-fade-up">
                <div
                  className={cn(
                    'flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl p-5 border',
                    isExercisePassed
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : 'bg-warning-soft/60 border-warning text-ink',
                  )}
                >
                  <div className="flex items-center gap-4">
                    <ScoreRing value={overallScore} label="Score" size={80} />
                    <div>
                      <h4 className="font-extrabold text-base">
                        {isExercisePassed
                          ? (overallScore >= 95
                              ? 'Masha Allah! Exceptional pronunciation & Tajweed'
                              : 'Exercise Passed! Rule articulation verified ✅')
                          : 'Needs Practice — Try reciting again'}
                      </h4>
                      <p className="text-xs opacity-80 mt-0.5">
                        Similarity: {testResult.phrase_verification.similarity_percentage.toFixed(1)}% ·
                        Character Accuracy: {testResult.phrase_verification.character_accuracy_percentage.toFixed(1)}% ·
                        Tajweed Score: {avgRuleScore}%
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isExercisePassed && activeExtractIdx < allExtracts.length - 1 && (
                      <Button
                        size="lg"
                        variant="primary"
                        onClick={() => {
                          setActiveExtractIdx((i) => i + 1);
                          setTestResult(null);
                        }}
                        className="font-bold shrink-0"
                      >
                        Next Exercise ({activeExtractIdx + 2}/{allExtracts.length}) ➔
                      </Button>
                    )}
                    {isExercisePassed && activeExtractIdx === allExtracts.length - 1 && (
                      <Button
                        size="lg"
                        variant="primary"
                        onClick={() => {
                          if (nextChapter) {
                            navigate(`/learn/tajweed/lesson/${nextChapter.id}`);
                            setActiveTab('theory');
                            setTestResult(null);
                          } else {
                            navigate('/learn/tajweed');
                          }
                        }}
                        className="font-bold shrink-0"
                      >
                        Complete Chapter & Continue ➔
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTestResult(null)}
                      className="text-xs"
                    >
                      <Icon name="restart" size={13} /> Re-try
                    </Button>
                  </div>
                </div>

                {/* Applicable Rule Evaluations */}
                <div className="space-y-3 pt-2">
                  <SectionHeader
                    title="Tajweed Rule Evaluations"
                    subtitle="Feedback on detected articulation & pronunciation rules"
                  />
                  {applicableRules.map((ev, idx) => (
                    <RuleEvaluationCard key={ev.rule_id + idx} evaluation={ev} />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ----------------- Sticky Bottom Action Bar ----------------- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 border-t border-border px-4 py-3.5 backdrop-blur shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {prevChapter ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigate(`/learn/tajweed/lesson/${prevChapter.id}`);
                  setActiveTab('theory');
                  setTestResult(null);
                }}
              >
                ← Prev Chapter
              </Button>
            ) : (
              <span className="text-xs font-semibold text-ink-faint">Chapter 1 of 19</span>
            )}
          </div>

          {/* Center Status */}
          <div className="text-center hidden sm:block">
            {isCompleted ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-center">
                <Icon name="check" size={14} /> Chapter {chapter.chapterNumber} Completed ({bestScore}%)
              </span>
            ) : hasExtracts ? (
              <span className="text-xs font-semibold text-ink-soft">
                {passedCount} of {allExtracts.length} exercises passed (all required to unlock next chapter)
              </span>
            ) : (
              <span className="text-xs font-semibold text-ink-soft">
                Foundational Concept Reading
              </span>
            )}
          </div>

          {/* Right Action */}
          <div>
            {isCompleted && nextChapter ? (
              <Button
                size="md"
                variant="primary"
                onClick={() => {
                  navigate(`/learn/tajweed/lesson/${nextChapter.id}`);
                  setActiveTab('theory');
                  setTestResult(null);
                }}
                className="font-extrabold shadow-md"
              >
                Next Chapter: {nextChapter.title} ➔
              </Button>
            ) : isCompleted && !nextChapter ? (
              <Button
                size="md"
                variant="primary"
                onClick={() => navigate('/learn/tajweed')}
                className="font-extrabold"
              >
                Course Syllabus ➔
              </Button>
            ) : !hasExtracts ? (
              <Button
                size="md"
                variant="primary"
                onClick={handleCompleteTheoryOnly}
                className="font-extrabold"
              >
                Complete & Unlock Next ➔
              </Button>
            ) : (
              <Button size="md" variant="secondary" disabled className="opacity-60 cursor-not-allowed">
                <Icon name="lock" size={14} /> Next Lesson Locked
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ----------------- Chapter Completed Celebration Modal ----------------- */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm anim-fade-up">
          <Card className="max-w-md text-center p-6 sm:p-8 space-y-5 bg-surface shadow-2xl border-emerald-500 border-2">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700 shadow-inner">
              <Icon name="check" size={32} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-ink">Chapter {chapter.chapterNumber} Completed! 🎉</h3>
              <p className="text-xs font-bold text-brand-700">{chapter.title} ({chapter.arabicTitle})</p>
              <p className="text-xs text-ink-faint pt-1 leading-relaxed">
                Masha&apos;Allah! You have successfully recited and passed all {allExtracts.length} practice exercises.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {nextChapter ? (
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => {
                    setShowCompletionModal(false);
                    navigate(`/learn/tajweed/lesson/${nextChapter.id}`);
                    setActiveTab('theory');
                    setTestResult(null);
                  }}
                  className="font-bold shadow-lg"
                >
                  Continue to Chapter {nextChapter.chapterNumber}: {nextChapter.title} ➔
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => {
                    setShowCompletionModal(false);
                    navigate('/learn/tajweed');
                  }}
                >
                  Return to Syllabus Overview
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowCompletionModal(false)}>
                Stay on this lesson
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
