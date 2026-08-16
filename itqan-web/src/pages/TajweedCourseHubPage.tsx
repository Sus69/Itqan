import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import { TAJWEED_INFO_CHAPTERS } from '@/lib/infoData';
import {
  loadCourseProgress,
  isChapterUnlocked,
  TAJWEED_TIERS,
  type CourseProgressState,
} from '@/lib/courseState';

export default function TajweedCourseHubPage() {
  const navigate = useNavigate();
  const [progress] = useState<CourseProgressState>(() => loadCourseProgress());
  const [selectedTier, setSelectedTier] = useState<number | 'all'>('all');

  const totalChapters = TAJWEED_INFO_CHAPTERS.length;
  const completedCount = progress.completedChapterIds.length;
  const overallPct = Math.round((completedCount / totalChapters) * 100);

  const activeChapter = useMemo(() => {
    return (
      TAJWEED_INFO_CHAPTERS.find((c) => c.id === progress.activeChapterId) ||
      TAJWEED_INFO_CHAPTERS[0]
    );
  }, [progress.activeChapterId]);

  const filteredTiers = useMemo(() => {
    if (selectedTier === 'all') return TAJWEED_TIERS;
    return TAJWEED_TIERS.filter((t) => t.tierNumber === selectedTier);
  }, [selectedTier]);

  return (
    <div className="space-y-6 anim-fade-up">
      {/* Hero Course Progress Banner */}
      <Card className="overflow-hidden border-border bg-gradient-to-br from-brand-900 via-brand-850 to-brand-700 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white backdrop-blur">
                <Icon name="book" size={13} strokeWidth={2.5} /> 19 Chapters · 6 Tiers
              </Badge>
              <Badge className="bg-gold-500/20 text-gold-200 border border-gold-400/30 backdrop-blur">
                <Icon name="sparkle" size={13} /> INFO.md Standard
              </Badge>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-white">
              Tajweed Masterclass
            </h1>
            <p className="arabic-text text-lg text-gold-300 font-bold" dir="rtl">
              دورة إتقان التجويد الشاملة
            </p>
            <p className="text-sm leading-relaxed text-brand-100/90">
              Master Quranic recitation with a structured 3-part workflow for every chapter:
              <strong className="text-white"> 1. Theory</strong> ➔
              <strong className="text-white"> 2. Practice Verses</strong> ➔
              <strong className="text-white"> 3. AI Recitation Test</strong>.
            </p>
          </div>

          {/* Progress ring & CTA */}
          <div className="flex flex-col items-center sm:items-end justify-between gap-4 rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/15">
            <div className="flex items-center gap-4">
              <div className="relative grid size-16 place-items-center">
                <svg className="size-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/20"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-gold-400 transition-all duration-700"
                    strokeDasharray={`${overallPct}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-black text-white">{overallPct}%</span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Course Progress</p>
                <p className="text-base font-extrabold text-white">
                  {completedCount} of {totalChapters} Chapters
                </p>
                <p className="text-xs text-gold-300 font-bold mt-0.5">⚡ {progress.xp} XP Earned</p>
              </div>
            </div>

            <Button
              size="lg"
              variant="gold"
              onClick={() => navigate(`/learn/tajweed/lesson/${activeChapter.id}`)}
              className="w-full sm:w-auto font-extrabold shadow-lg"
            >
              <Icon name="play" size={18} />
              Continue Chapter {activeChapter.chapterNumber}: {activeChapter.title}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tier Selector Navigation Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedTier('all')}
            className={cn(
              'rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all',
              selectedTier === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-border bg-surface text-ink-soft hover:border-brand-300 hover:text-ink',
            )}
          >
            All 6 Tiers
          </button>
          {TAJWEED_TIERS.map((tier) => {
            const active = selectedTier === tier.tierNumber;
            return (
              <button
                key={tier.tierNumber}
                type="button"
                onClick={() => setSelectedTier(tier.tierNumber)}
                className={cn(
                  'rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
                  active
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'border border-border bg-surface text-ink-soft hover:border-brand-300 hover:text-ink',
                )}
              >
                Tier {tier.tierNumber}
              </button>
            );
          })}
        </div>

        <Link
          to="/learn/tajweed/reference"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 hover:underline"
        >
          <Icon name="book" size={14} /> Open Full Reference Guide ➔
        </Link>
      </div>

      {/* Tier Sections List */}
      <div className="space-y-8">
        {filteredTiers.map((tier) => (
          <div key={tier.tierNumber} className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-md bg-brand-600 text-xs font-black text-white">
                    T{tier.tierNumber}
                  </span>
                  <h2 className="text-lg font-extrabold text-ink sm:text-xl">{tier.title}</h2>
                </div>
                <p className="text-xs text-ink-faint mt-1">{tier.summary}</p>
              </div>
              <span className="arabic-text text-base font-bold text-brand-700" dir="rtl">
                {tier.arabicTitle}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tier.chapters.map((chap) => {
                const isCompleted = progress.completedChapterIds.includes(chap.id);
                const score = progress.chapterScores[chap.id];
                const isActive = progress.activeChapterId === chap.id;
                const isUnlocked = isChapterUnlocked(chap.id, progress);
                const drillCount = chap.subChapters.reduce(
                  (acc, s) => acc + (s.examples?.length || 0),
                  0,
                );

                return (
                  <Link
                    key={chap.id}
                    to={`/learn/tajweed/lesson/${chap.id}`}
                    className={cn(
                      'group relative flex flex-col justify-between rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]',
                      !isUnlocked
                        ? 'border-border/60 bg-surface/50 opacity-60'
                        : isCompleted
                          ? 'border-emerald-300/80 bg-emerald-50/20 hover:border-emerald-500'
                          : isActive
                            ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20'
                            : 'border-border bg-surface hover:border-brand-300',
                    )}
                  >
                    <div>
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-faint">
                          Chapter {chap.chapterNumber}
                        </span>
                        {!isUnlocked ? (
                          <Badge tone="neutral" className="bg-sand-100 text-sand-700">
                            <Icon name="lock" size={11} /> Locked
                          </Badge>
                        ) : isCompleted ? (
                          <Badge tone="neutral" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                            <Icon name="check" size={12} /> Completed
                          </Badge>
                        ) : isActive ? (
                          <Badge tone="brand" className="animate-pulse">Active Lesson</Badge>
                        ) : (
                          <Badge tone="neutral">Ready</Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-ink group-hover:text-brand-700 transition-colors">
                        {chap.title}
                      </h3>
                      <p className="arabic-text mt-1 text-sm font-semibold text-brand-800" dir="rtl">
                        {chap.arabicTitle}
                      </p>
                      <p className="mt-2.5 text-xs text-ink-faint line-clamp-2 leading-relaxed">
                        {chap.summary}
                      </p>
                    </div>

                    {/* Footer Row */}
                    <div className="mt-4 border-t border-border/50 pt-3 flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-soft flex items-center gap-1">
                        <Icon name="note" size={13} className="text-brand-600" />
                        {drillCount > 0 ? `${drillCount} Practice Drills` : 'Concept Reading'}
                      </span>
                      {!isUnlocked ? (
                        <span className="text-ink-faint font-medium">Locked 🔒</span>
                      ) : score !== undefined ? (
                        <span className={cn('font-extrabold', score >= 80 ? 'text-emerald-700' : 'text-brand-700')}>
                          Score: {score}%
                        </span>
                      ) : (
                        <span className="text-brand-700 font-bold">Start ➔</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
