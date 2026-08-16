import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { analyzeTajweed, isInsufficientSpeech, type TajweedResult } from '@/lib/api';
import { VERSES, findVerseByIdOrText, type PracticeVerse } from '@/lib/verses';
import { RecorderPanel } from '@/components/RecorderPanel';
import { RuleEvaluationCard } from '@/components/RuleEvaluationCard';
import { Badge, Button, Card, ScoreRing, SectionHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import { formatSeconds } from '@/lib/format';

type Phase = 'select' | 'record' | 'result';
type DifficultyFilter = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';

export default function TajweedStudioPage() {
  const [searchParams] = useSearchParams();
  const extractTextParam = searchParams.get('extractText');
  const verseIdParam = searchParams.get('verse');

  const initialVerse = useMemo(() => {
    const fromParam = findVerseByIdOrText(extractTextParam || verseIdParam);
    if (fromParam) return fromParam;
    if (extractTextParam) {
      return {
        id: 'custom-extract',
        surah: 'INFO.md Drill',
        ayah: 'Extract',
        arabicName: 'مقتطف تجويدي',
        text: extractTextParam,
        focusRules: ['INFO.md Practice Drill'],
        difficulty: 'Intermediate' as const,
      };
    }
    return VERSES[0];
  }, [extractTextParam, verseIdParam]);

  const [verse, setVerse] = useState<PracticeVerse>(initialVerse);
  const [phase, setPhase] = useState<Phase>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('All');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechWarning, setSpeechWarning] = useState<string | null>(null);
  const [result, setResult] = useState<TajweedResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialVerse) {
      setVerse(initialVerse);
    }
  }, [initialVerse]);

  // Filtered verses list
  const filteredVerses = useMemo(() => {
    return VERSES.filter((v) => {
      const matchesDiff = difficultyFilter === 'All' || v.difficulty === difficultyFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesDiff;
      const matchesSearch =
        v.surah.toLowerCase().includes(q) ||
        v.ayah.toLowerCase().includes(q) ||
        v.text.includes(q) ||
        v.focusRules.some((r) => r.toLowerCase().includes(q));
      return matchesDiff && matchesSearch;
    });
  }, [difficultyFilter, searchQuery]);

  const applicableCount = useMemo(
    () => result?.evaluations.filter((e) => e.applicable && e.status !== 'not_applicable') ?? [],
    [result],
  );
  const passedCount = applicableCount.filter(
    (e) => e.status === 'passed' || (e.confidence_score !== undefined && e.confidence_score >= 95),
  ).length;

  const overallScore = result
    ? Math.round(
        (result.phrase_verification.similarity_percentage * 0.4 +
          result.phrase_verification.character_accuracy_percentage * 0.4 +
          result.alignment_confidence * 0.2) *
          1,
      )
    : 0;

  const handleRecorded = async (blob: Blob, fileName: string) => {
    setBusy(true);
    setError(null);
    setSpeechWarning(null);
    try {
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const res = await analyzeTajweed(blob, verse.text, fileName);
      if (isInsufficientSpeech(res)) {
        setSpeechWarning(
          'We could not detect clear recitation in that audio. Find a quieter space, move closer to the mic, and try again.',
        );
        setResult(null);
        setPhase('record');
      } else {
        setResult(res);
        setPhase('result');
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Analysis failed. Ensure the backend server is running on port 8000.',
      );
    } finally {
      setBusy(false);
    }
  };

  const resetAll = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setResult(null);
    setSpeechWarning(null);
    setError(null);
    setPhase('select');
  };

  return (
    <div className="anim-fade-up space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Tajweed Studio 🎙️
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Recite any Quranic Aayah and get instant rule-by-rule AI feedback grounded in authentic Tajweed rules.
          </p>
        </div>
        <Badge tone="brand">
          <Icon name="sparkle" size={13} /> 20 Aayahs · 5-Stage AI Engine
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* ---------------- Verse picker (left column) ---------------- */}
        <Card className="h-fit space-y-4 lg:sticky lg:top-24 max-h-[85vh] flex flex-col">
          <SectionHeader
            title="Practice Aayahs"
            subtitle={`${filteredVerses.length} verses · Select an Aayah to recite`}
          />

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search Surah, Ayah, or rule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Icon name="search" size={15} className="absolute left-3 top-2.5 text-ink-faint" />
          </div>

          {/* Difficulty Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
            {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficultyFilter(diff)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-all',
                  difficultyFilter === diff
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-surface-2 text-ink-soft hover:bg-brand-50 hover:text-ink',
                )}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Verses Scroll List */}
          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
            {filteredVerses.map((v) => {
              const active = v.id === verse.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setVerse(v);
                    resetAll();
                  }}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-3 text-left transition-all',
                    active
                      ? 'border-brand-500 bg-brand-50/90 shadow-[var(--shadow-ring)] ring-1 ring-brand-500/30'
                      : 'border-border bg-surface hover:border-brand-300 hover:bg-brand-50/30',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink truncate">
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
                      className="text-[10px] px-2 py-0.5 shrink-0"
                    >
                      {v.difficulty}
                    </Badge>
                  </div>

                  <p className="quran-text mt-1.5 line-clamp-1 text-right text-sm leading-relaxed text-ink" dir="rtl">
                    {v.text}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {v.focusRules.slice(0, 2).map((r, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold text-ink-faint truncate max-w-[140px]"
                      >
                        {r}
                      </span>
                    ))}
                    {v.focusRules.length > 2 && (
                      <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold text-ink-faint">
                        +{v.focusRules.length - 2} rules
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ---------------- Studio main area ---------------- */}
        <div className="space-y-6">
          {/* Verse hero + recorder */}
          <Card className="overflow-hidden">
            <div className="rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-6 text-white sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-100/80">
                    PRACTICE TARGET · {verse.surah} {verse.ayah}
                  </p>
                  <p className="mt-1 text-lg font-bold">Recite with focus and calm</p>
                </div>
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/12 backdrop-blur">
                  <Icon name="book" size={22} className="text-gold-300" />
                </div>
              </div>

              <p
                className="quran-text mt-5 text-center leading-[2.5] text-white"
                style={{ fontSize: 'clamp(1.5rem, 2.4vw + 0.5rem, 2.4rem)' }}
                dir="rtl"
                lang="ar"
              >
                {verse.text}
              </p>

              {/* All Applicable Rules Badges */}
              <div className="mt-6 pt-4 border-t border-white/15">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gold-300 block mb-2 text-center">
                  Applicable Tajweed Rules ({verse.focusRules.length})
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {verse.focusRules.map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur border border-white/20"
                    >
                      <span className="size-1.5 rounded-full bg-gold-400" />
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6">
              <RecorderPanel
                onRecorded={handleRecorded}
                busy={busy}
                busyLabel="Evaluating recitation with Tajweed Engine…"
                hint="Recite into your microphone — AI evaluates all applicable rules"
              />

              {(error || speechWarning) && (
                <p
                  className={cn(
                    'mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium',
                    error ? 'bg-error-soft text-error' : 'bg-warning-soft text-warning',
                  )}
                >
                  <Icon name={error ? 'alert' : 'info'} size={16} className="mt-0.5 shrink-0" />
                  <span>{error ?? speechWarning}</span>
                </p>
              )}
            </div>
          </Card>

          {/* ---------------- Results ---------------- */}
          {phase === 'result' && result && (
            <div className="anim-fade-up space-y-6">
              {/* Score ring + summary */}
              <Card className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8 p-6">
                <ScoreRing value={overallScore} label="Overall Score" size={136} />
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <Badge tone={overallScore >= 80 ? 'brand' : overallScore >= 60 ? 'gold' : 'neutral'}>
                    {overallScore >= 80
                      ? 'Excellent Recitation'
                      : overallScore >= 60
                        ? 'Good Recitation'
                        : 'Needs Refinement'}
                  </Badge>
                  <h2 className="text-xl font-bold text-ink">
                    {passedCount} of {applicableCount.length} applicable rules passed
                  </h2>
                  <p className="text-xs text-ink-faint leading-relaxed">
                    Similarity: {result.phrase_verification.similarity_percentage.toFixed(1)}% ·
                    Character Accuracy: {result.phrase_verification.character_accuracy_percentage.toFixed(1)}% ·
                    Audio Duration: {formatSeconds(result.audio_duration_seconds)}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={resetAll}>
                      <Icon name="restart" size={14} /> Try another Aayah
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Rule-by-rule evaluation list */}
              <Card className="space-y-4">
                <SectionHeader
                  title="Tajweed Rule Evaluations"
                  subtitle={`${applicableCount.length} applicable rules evaluated against authentic INFO.md criteria`}
                />
                <div className="space-y-3">
                  {result.evaluations
                    .filter((ev) => ev.applicable && ev.status !== 'not_applicable')
                    .map((ev, idx) => (
                      <RuleEvaluationCard key={ev.rule_id + idx} evaluation={ev} />
                    ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
