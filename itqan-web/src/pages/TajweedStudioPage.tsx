import { useMemo, useState } from 'react';
import { analyzeTajweed, isInsufficientSpeech, type TajweedResult } from '@/lib/api';
import { VERSES, type PracticeVerse } from '@/lib/verses';
import { RecorderPanel } from '@/components/RecorderPanel';
import { ColorCodedVerse } from '@/components/ColorCodedVerse';
import { RuleEvaluationCard } from '@/components/RuleEvaluationCard';
import { Badge, Button, Card, ScoreRing, SectionHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import { formatSeconds } from '@/lib/format';

type Phase = 'select' | 'record' | 'result';

export default function TajweedStudioPage() {
  const [verse, setVerse] = useState<PracticeVerse>(VERSES[0]);
  const [phase, setPhase] = useState<Phase>('select');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechWarning, setSpeechWarning] = useState<string | null>(null);
  const [result, setResult] = useState<TajweedResult | null>(null);

  const applicableCount = useMemo(
    () => result?.evaluations.filter((e) => e.applicable && e.status !== 'not_applicable') ?? [],
    [result],
  );
  const passedCount = applicableCount.filter((e) => e.status === 'passed').length;

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
        e instanceof Error ? e.message : 'Analysis failed. Ensure the backend server is running.',
      );
    } finally {
      setBusy(false);
    }
  };

  const resetAll = () => {
    setResult(null);
    setSpeechWarning(null);
    setError(null);
  };

  return (
    <div className="anim-fade-up space-y-6">
      {/* Page header (TAJ-001 spirit) */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Tajweed Studio
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Recite a verse and receive rule-by-rule AI feedback grounded in authentic Tajweed.
          </p>
        </div>
        <Badge tone="brand">
          <Icon name="sparkle" size={13} /> AI Evaluation · 5-Stage Engine
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* ---------------- Verse picker (left column) ---------------- */}
        <Card className="h-fit lg:sticky lg:top-24">
          <SectionHeader
            title="Choose a verse"
            subtitle="Select what you want to practice"
          />
          <div className="space-y-2">
            {VERSES.map((v) => {
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
                    'w-full rounded-xl border px-4 py-3 text-left transition-all',
                    active
                      ? 'border-brand-500 bg-brand-50 shadow-[var(--shadow-ring)]'
                      : 'border-border bg-surface hover:border-brand-300 hover:bg-brand-50/40',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-ink">
                      {v.surah} · {v.ayah}
                    </span>
                    <Badge tone={active ? 'brand' : 'neutral'}>{v.difficulty}</Badge>
                  </div>
                  <p className="arabic-text mt-1.5 line-clamp-1 text-base leading-relaxed text-ink-soft" dir="rtl">
                    {v.text}
                  </p>
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
                    Practice target · {verse.surah} {verse.ayah}
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
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {verse.focusRules.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold text-brand-50 backdrop-blur"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <RecorderPanel
                onRecorded={handleRecorded}
                busy={busy}
                busyLabel="Analyzing recitation…"
                hint={verse.difficulty}
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

          {/* ---------------- Results (TAJ-008 / TAJ-009) ---------------- */}
          {phase === 'result' && result && (
            <div className="anim-fade-up space-y-6">
              {/* Score summary */}
              <Card className="!!overflow-visible">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
                  <ScoreRing value={overallScore} label="Overall" size={132} />
                  <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-bold text-ink">
                      {overallScore >= 85
                        ? 'Excellent recitation — Masha Allah'
                        : overallScore >= 60
                          ? 'Good progress — a few rules to polish'
                          : 'Keep practicing — your AI teacher is here to help'}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MiniMetric
                        label="Text accuracy"
                        value={result.phrase_verification.character_accuracy_percentage}
                      />
                      <MiniMetric
                        label="Similarity"
                        value={result.phrase_verification.similarity_percentage}
                      />
                      <MiniMetric label="Alignment" value={result.alignment_confidence} />
                    </div>
                    <p className="text-xs text-ink-faint">
                      {passedCount} of {applicableCount.length} applicable rules passed ·{' '}
                      {formatSeconds(result.audio_duration_seconds)} of audio
                    </p>
                  </div>
                </div>
              </Card>

              {/* Color-coded alignment */}
              <div>
                <SectionHeader
                  title="Recitation breakdown"
                  subtitle="Each letter is colored by how clearly it was detected"
                />
                <ColorCodedVerse
                  expectedText={result.phrase_verification.expected_text}
                  alignment={result.alignment}
                  evaluations={result.evaluations}
                />
              </div>

              {/* Rule-by-rule */}
              <div>
                <SectionHeader
                  title="Tajweed rules"
                  subtitle="Expand any rule to see what the AI teacher recommends"
                  action={
                    <Badge tone="brand">
                      {applicableCount.length} active rule{applicableCount.length === 1 ? '' : 's'}
                    </Badge>
                  }
                />
                <div className="space-y-2.5">
                  {result.evaluations
                    .filter((e) => e.applicable)
                    .map((evaluation) => (
                      <RuleEvaluationCard key={evaluation.rule_id} evaluation={evaluation} />
                    ))}
                  {result.evaluations.filter((e) => e.applicable).length === 0 && (
                    <Card className="py-8 text-center text-sm text-ink-faint">
                      No applicable Tajweed rules were parsed for this verse.
                    </Card>
                  )}
                </div>
              </div>

              {/* Next actions */}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button variant="secondary" onClick={resetAll}>
                  <Icon name="restart" size={17} />
                  Record again
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const idx = VERSES.findIndex((v) => v.id === verse.id);
                    const next = VERSES[(idx + 1) % VERSES.length];
                    setVerse(next);
                    resetAll();
                  }}
                >
                  Next verse
                  <Icon name="arrowRight" size={17} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const tone = v >= 85 ? 'text-success' : v >= 60 ? 'text-warning' : 'text-error';
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-3.5 py-2.5">
      <p className={cn('text-xl font-extrabold tabular-nums', tone)}>{Math.round(v)}%</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}
