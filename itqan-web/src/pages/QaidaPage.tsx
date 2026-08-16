import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, Badge, Button } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { QAIDA_LESSONS } from '@/lib/qaidaData';
import { loadQaidaState } from '@/lib/qaidaState';

export default function QaidaPage() {
  const navigate = useNavigate();
  const [qaidaState, setQaidaState] = useState(loadQaidaState());
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setQaidaState(loadQaidaState());
  }, []);

  const completedCount = qaidaState.completedLessonIds.length;
  const overallPercent = Math.round((completedCount / QAIDA_LESSONS.length) * 100);
  const totalTilesPracticed = qaidaState.practicedTileIds.length;

  const filteredLessons = QAIDA_LESSONS.filter((l) => {
    const matchesStage = selectedStage === 'all' || l.stage === selectedStage;
    const matchesSearch =
      l.titleEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.titleArabic.includes(searchQuery) ||
      l.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const stages = [
    { id: 1, title: 'Stage 1: Letters & Forms', count: 2, desc: 'Alphabet Recognition & Cursive Compound Shapes' },
    { id: 2, title: 'Stage 2: Vowels & Movement', count: 4, desc: 'Short Harakaat, Contrast Drills & Tanween' },
    { id: 3, title: 'Stage 3: Prolongation & Jazm', count: 5, desc: 'Maddah, Standing Vowels, Leen & Qalqala Echo' },
    { id: 4, title: 'Stage 4: Recitation Rules & Fluency', count: 11, desc: 'Noon/Meem Saakin, Tafkheem, Waqf & Salah Prayers' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Madani Qa'idah — The Quranic Literacy Engine"
          subtitle="Pillar 2 · Master foundational Arabic reading, letter articulation (Makhaarij), and Quranic fluency across 22 progressive lessons."
        />
        <Link to="/qaida/makharij">
          <Button variant="secondary" className="border-brand-300 bg-brand-50 text-brand-800">
            <Icon name="sparkle" size={16} />
            Makhaarij Articulation Atlas
          </Button>
        </Link>
      </div>

      {/* Hero Stats & Quick Resume Banner */}
      <Card className="relative overflow-hidden border-brand-200 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="rounded-full bg-gold-500/20 px-2.5 py-0.5 text-xs font-bold text-gold-300">
                22 Progressive Lessons · 17 Makhaarij Points
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white">
                {overallPercent}% Complete
              </span>
            </div>
            <h2 className="text-2xl font-black sm:text-3xl">
              Your Journey to Flawless Arabic Reading
            </h2>
            <p className="text-xs leading-relaxed text-brand-100/80 sm:text-sm">
              From individual glyphs to multi-syllable Quranic verses. Interactive clickable tile grids, audio pronunciation breakdown, and voice evaluation.
            </p>

            {/* Micro Stats */}
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-bold text-brand-200">
              <div className="flex items-center gap-1.5">
                <Icon name="check" size={14} className="text-gold-400" />
                <span>{completedCount} / 22 Lessons Mastered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="practice" size={14} className="text-gold-400" />
                <span>{totalTilesPracticed} Characters Practiced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="sparkle" size={14} className="text-gold-400" />
                <span>{qaidaState.totalXp} XP Earned</span>
              </div>
            </div>
          </div>

          {/* Quick Launcher Card */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md lg:min-w-64">
            <span className="text-xs font-bold text-brand-200">Current Roadmap Position</span>
            <span className="mt-1 font-arabic text-xl font-bold text-gold-300">
              Lesson {qaidaState.activeLessonId}: {QAIDA_LESSONS[qaidaState.activeLessonId - 1]?.titleArabic}
            </span>
            <p className="mt-0.5 text-xs text-brand-200">
              {QAIDA_LESSONS[qaidaState.activeLessonId - 1]?.titleEnglish}
            </p>

            <Button
              variant="gold"
              size="md"
              className="mt-4 w-full"
              onClick={() => navigate(`/qaida/lesson/${qaidaState.activeLessonId}`)}
            >
              <Icon name="play" size={16} />
              {completedCount === 0 ? 'Start Lesson 1' : 'Resume Learning'}
            </Button>
          </div>
        </div>

        {/* Decorative background Islamic geometry glow */}
        <div className="pointer-events-none absolute -right-10 -bottom-10 size-60 rounded-full bg-brand-500/20 blur-3xl" />
      </Card>

      {/* Makhaarij Banner Callout */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/qaida/makharij"
          className="group flex items-center justify-between rounded-2xl border border-sand-200 bg-surface-1 p-5 shadow-xs transition-all hover:border-brand-400 hover:shadow-md"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-800">
                Atlas
              </span>
              <h4 className="text-sm font-bold text-ink group-hover:text-brand-700">
                17 Points of Articulation (المخارج)
              </h4>
            </div>
            <p className="text-xs text-ink-faint">
              Interactive anatomical atlas covering Throat, Tongue, Lips, Oral Cavity & Nose.
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white">
            <Icon name="arrow-right" size={16} />
          </div>
        </Link>

        <Link
          to="/qaida/lesson/22"
          className="group flex items-center justify-between rounded-2xl border border-sand-200 bg-surface-1 p-5 shadow-xs transition-all hover:border-brand-400 hover:shadow-md"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-gold-100 px-2 py-0.5 text-[11px] font-bold text-gold-800">
                Final Milestone
              </span>
              <h4 className="text-sm font-bold text-ink group-hover:text-brand-700">
                Daily Salah Recitation Suite
              </h4>
            </div>
            <p className="text-xs text-ink-faint">
              Apply all 22 lessons to Surah Al-Fatihah, Tashahhud, Durood, and Qunoot.
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-gold-50 text-gold-600 group-hover:bg-gold-600 group-hover:text-white">
            <Icon name="arrow-right" size={16} />
          </div>
        </Link>
      </div>

      {/* Stage Filters & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStage('all')}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              selectedStage === 'all'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'border border-border bg-surface-1 text-ink-soft hover:bg-sand-100'
            }`}
          >
            All Lessons (22)
          </button>
          {stages.map((stg) => (
            <button
              key={stg.id}
              onClick={() => setSelectedStage(stg.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                selectedStage === stg.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'border border-border bg-surface-1 text-ink-soft hover:bg-sand-100'
              }`}
            >
              Stage {stg.id} ({stg.count})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search lessons or rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-1 py-2 pr-4 pl-9 text-xs text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none"
          />
          <span className="absolute top-2.5 left-3 text-ink-faint">
            <Icon name="search" size={14} />
          </span>
        </div>
      </div>

      {/* 22-Lesson Course Roadmap Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredLessons.map((l) => {
          const isCompleted = qaidaState.completedLessonIds.includes(l.id);
          const isCurrent = qaidaState.activeLessonId === l.id;
          const practicedCount = qaidaState.lessonProgress[l.id]?.practicedTiles.length || 0;

          return (
            <div
              key={l.id}
              onClick={() => navigate(`/qaida/lesson/${l.id}`)}
              className={`group flex cursor-pointer flex-col justify-between rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                isCompleted
                  ? 'border-brand-200/80 bg-surface-1'
                  : isCurrent
                  ? 'border-brand-500 bg-brand-50/30 shadow-md ring-2 ring-brand-500/20'
                  : 'border-border bg-surface-1 hover:border-brand-300'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-sand-100 px-2 py-0.5 text-[10px] font-bold text-ink-faint">
                    Lesson {l.id} · {l.stageTitle}
                  </span>
                  {isCompleted ? (
                    <Badge tone="success">
                      <Icon name="check" size={12} /> Mastered
                    </Badge>
                  ) : isCurrent ? (
                    <Badge tone="brand">In Progress</Badge>
                  ) : (
                    <span className="text-[10px] text-ink-faint">
                      {l.estimatedMinutes} min
                    </span>
                  )}
                </div>

                {/* Arabic & English Title */}
                <div className="mt-3 space-y-0.5">
                  <h3 className="font-arabic text-xl font-bold text-brand-800 group-hover:text-brand-600">
                    {l.titleArabic}
                  </h3>
                  <h4 className="text-sm font-bold text-ink">
                    {l.titleEnglish}
                  </h4>
                </div>

                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-faint">
                  {l.summary}
                </p>
              </div>

              {/* Card Footer: Tile count + Action */}
              <div className="mt-5 flex items-center justify-between border-t border-sand-100 pt-3">
                <span className="text-xs text-ink-faint">
                  {practicedCount} / {l.tiles.length} characters practiced
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:translate-x-0.5">
                  Open <Icon name="arrow-right" size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
