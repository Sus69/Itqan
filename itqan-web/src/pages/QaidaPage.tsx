import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, EmptyState, ProgressBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { QAIDA_LESSONS } from '@/lib/qaidaData';
import { loadQaidaState, lessonProgressFor } from '@/lib/qaidaState';

/**
 * The Qa'idah roadmap.
 *
 * One resume action at the top, then the full sequence. Every figure on this page
 * is counted from stored progress — there is no points total, and a lesson only
 * reads as completed once it has actually been completed, so the roadmap can be
 * trusted as a record of where the learner is.
 */
export default function QaidaPage() {
  const [state] = useState(loadQaidaState);
  const [stage, setStage] = useState<number | 'all'>('all');
  const [query, setQuery] = useState('');

  const completed = state.completedLessonIds.length;
  const total = QAIDA_LESSONS.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const resumeLesson =
    QAIDA_LESSONS.find((l) => l.id === state.activeLessonId) ??
    QAIDA_LESSONS.find((l) => !state.completedLessonIds.includes(l.id)) ??
    QAIDA_LESSONS[0];

  // Stage groupings come from the data, so the counts cannot drift from it.
  const stages = useMemo(() => {
    const seen = new Map<number, { id: number; title: string; count: number }>();
    for (const lesson of QAIDA_LESSONS) {
      const entry = seen.get(lesson.stage);
      if (entry) entry.count += 1;
      else seen.set(lesson.stage, { id: lesson.stage, title: lesson.stageTitle, count: 1 });
    }
    return [...seen.values()].sort((a, b) => a.id - b.id);
  }, []);

  const needle = query.trim().toLowerCase();
  const lessons = QAIDA_LESSONS.filter((l) => {
    const inStage = stage === 'all' || l.stage === stage;
    const matches =
      needle.length === 0 ||
      l.titleEnglish.toLowerCase().includes(needle) ||
      l.titleArabic.includes(query.trim()) ||
      l.summary.toLowerCase().includes(needle) ||
      l.keyRules.some((r) => r.toLowerCase().includes(needle));
    return inStage && matches;
  });

  return (
    <div className="anim-fade-up mx-auto max-w-shell space-y-6">
      <PageHeader
        title="Madani Qa'idah"
        subtitle={`Arabic reading from single letters to fluent recitation, in ${total} sequenced lessons. Work through them in order — each one assumes the sounds before it.`}
      />

      {/* Resume: the one action this page recommends. */}
      <Card className="overflow-hidden p-0">
        <div className="grid gap-6 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <Badge tone="glass">
              {completed === 0
                ? 'Not started'
                : completed >= total
                  ? 'Sequence finished'
                  : `Lesson ${resumeLesson.id} of ${total}`}
            </Badge>
            <h2 className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">
              {resumeLesson.titleEnglish}
            </h2>
            <p className="arabic-text mt-1 text-lg text-gold-300" dir="rtl" lang="ar">
              {resumeLesson.titleArabic}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100">
              {resumeLesson.summary}
            </p>
            <div className="mt-5 max-w-sm">
              <div className="flex items-center justify-between text-xs font-bold text-brand-100">
                <span>
                  {completed} of {total} lessons completed
                </span>
                <span className="tabular-nums">{percent}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gold-400 transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
          <Link to={`/learn/qaida/lesson/${resumeLesson.id}`} className="lg:justify-self-end">
            <Button size="lg" variant="gold">
              <Icon name="play" size={16} />
              {completed === 0 ? `Start lesson ${resumeLesson.id}` : `Continue lesson ${resumeLesson.id}`}
            </Button>
          </Link>
        </div>
      </Card>

      {/* Filters. The search box is the reason a 22-item list is browsable. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter lessons by stage"
        >
          <StageChip active={stage === 'all'} onClick={() => setStage('all')}>
            All {total}
          </StageChip>
          {stages.map((s) => (
            <StageChip key={s.id} active={stage === s.id} onClick={() => setStage(s.id)}>
              Stage {s.id} · {s.count}
            </StageChip>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <label className="sr-only" htmlFor="qaida-search">
            Search lessons
          </label>
          <input
            id="qaida-search"
            type="search"
            placeholder="Search lessons or rules"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-1 py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <span aria-hidden="true" className="absolute left-3 top-3 text-ink-faint">
            <Icon name="search" size={15} />
          </span>
        </div>
      </div>

      {stage !== 'all' && (
        <p className="text-xs font-semibold text-ink-faint">
          {stages.find((s) => s.id === stage)?.title}
        </p>
      )}

      {lessons.length === 0 ? (
        <EmptyState
          icon={<Icon name="search" size={22} />}
          title="No lessons match that"
          body="Try a letter name, a rule such as “madd”, or clear the filters to see the whole sequence."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('');
                setStage('all');
              }}
            >
              Show all lessons
            </Button>
          }
        />
      ) : (
        <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => {
            const progress = lessonProgressFor(state, lesson.id);
            const isComplete = state.completedLessonIds.includes(lesson.id);
            const isCurrent = !isComplete && state.activeLessonId === lesson.id;
            const heard = progress.heardTiles.length;

            return (
              <li key={lesson.id}>
                <Link
                  to={`/learn/qaida/lesson/${lesson.id}`}
                  className={`group flex h-full flex-col rounded-2xl border bg-surface p-5 transition-all hover:-translate-y-0.5 ${
                    isCurrent
                      ? 'border-brand-500/80 bg-brand-50/50 dark:bg-emerald-950/30 dark:border-emerald-500/50 ring-1 ring-brand-500/20'
                      : 'border-border hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                      Lesson {lesson.id}
                    </span>
                    {isComplete ? (
                      <Badge tone="success">
                        <Icon name="check" size={12} /> Completed
                      </Badge>
                    ) : isCurrent ? (
                      <Badge tone="brand">Up next</Badge>
                    ) : (
                      <span className="text-[11px] font-medium text-ink-soft">
                        about {lesson.estimatedMinutes} min
                      </span>
                    )}
                  </div>

                  <h3 className="arabic-text mt-3 text-xl font-semibold text-brand-700 dark:text-emerald-300" dir="rtl" lang="ar">
                    {lesson.titleArabic}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-ink group-hover:text-brand-600 dark:group-hover:text-emerald-300 transition-colors">
                    {lesson.titleEnglish}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                    {lesson.summary}
                  </p>

                  <div className="mt-auto pt-4">
                    <ProgressBar
                      value={Math.round((heard / Math.max(1, lesson.tiles.length)) * 100)}
                      tone={isComplete ? 'success' : 'brand'}
                    />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-ink-soft">
                      <span>
                        {heard} of {lesson.tiles.length} tiles heard
                        {progress.practicedTiles.length > 0 &&
                          ` · ${progress.practicedTiles.length} recorded`}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-brand-700 dark:text-emerald-400">
                        Open
                        <Icon
                          name="arrowRight"
                          size={12}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Card className="flex flex-col items-start justify-between gap-4 border-dashed bg-surface-2/60 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">Stuck on a particular sound?</p>
          <p className="mt-1 max-w-reading text-xs leading-relaxed text-ink-faint">
            The articulation atlas shows where each of the 17 points of articulation sits — throat,
            tongue, lips, oral cavity, nose — and lets you hear the letters that come from it.
          </p>
        </div>
        <Link to="/practice/articulation" className="shrink-0">
          <Button variant="secondary">
            <Icon name="wave" size={16} /> Open the articulation atlas
          </Button>
        </Link>
      </Card>
    </div>
  );
}

function StageChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
        active
          ? 'bg-brand-600 text-white shadow-[var(--shadow-soft)]'
          : 'border border-border bg-surface-1 text-ink-soft hover:bg-sand-100'
      }`}
    >
      {children}
    </button>
  );
}
