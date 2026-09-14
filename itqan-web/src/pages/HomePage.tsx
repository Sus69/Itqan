import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, ProgressBar, SectionHeader } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { getLearningGoal } from '@/lib/learnerGoal';
import { loadCourseProgress } from '@/lib/courseState';
import { loadQaidaState } from '@/lib/qaidaState';
import { loadAttempts, weakRules } from '@/lib/sessionLog';
import { resolveNextStep } from '@/lib/nextStep';
import { QAIDA_LESSONS } from '@/lib/qaidaData';
import { TAJWEED_INFO_CHAPTERS } from '@/lib/infoData';
import { useAuth } from '@/lib/authContext';

/**
 * Today — one recommended action, and nothing that competes with it.
 *
 * Everything shown is derived from stored progress at mount, so the page cannot
 * recommend a lesson the learner has already finished or report a streak that
 * has not been earned.
 */
export default function HomePage() {
  const { user, isDemo } = useAuth();

  // Read local progress once: it cannot change while this page is on screen.
  const [snapshot] = useState(() => {
    const qaida = loadQaidaState();
    const course = loadCourseProgress();
    const attempts = loadAttempts();
    return { qaida, course, attempts, goal: getLearningGoal() ?? 'tajweed' };
  });

  const next = resolveNextStep(snapshot.goal, snapshot);
  const outstanding = weakRules(snapshot.attempts).length;
  const displayName = user?.full_name?.split(' ')[0] || user?.username || 'friend';

  const qaidaTotal = QAIDA_LESSONS.length;
  const qaidaDone = snapshot.qaida.completedLessonIds.length;
  const tajweedTotal = TAJWEED_INFO_CHAPTERS.length;
  const tajweedDone = snapshot.course.completedChapterIds.length;

  return (
    <div className="anim-fade-up mx-auto max-w-shell space-y-7">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Today</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Assalamu alaikum, {displayName}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
          One calm, focused session is enough for meaningful progress.
        </p>
      </section>

      {/* The single recommendation. */}
      <Card className="overflow-hidden p-0 border-0">
        <div className="itq-hero-banner rounded-2xl p-7 sm:p-9">
          <Badge tone="hero" className="itq-hero-badge">
            <Icon name={next.icon} size={13} /> {next.eyebrow}
          </Badge>
          <h2 className="mt-4 max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
            {next.title}
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-emerald-100/90">{next.body}</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link to={next.to}>
              <Button size="lg" variant="gold">
                {next.cta} <Icon name="arrowRight" size={17} />
              </Button>
            </Link>
            <Link
              to="/learn"
              className="text-sm font-bold text-gold-300 underline-offset-4 hover:text-gold-200 hover:underline"
            >
              Or choose something else
            </Link>
          </div>
        </div>
      </Card>

      {/* Retention: only shown when there is something real to review. */}
      {outstanding > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-warning/30 bg-warning-soft">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-warning">
              <Icon name="note" size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">
                {outstanding} rule{outstanding === 1 ? '' : 's'} waiting to be revisited
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                Each one comes from a recording you made. Reciting that target cleanly clears it.
              </p>
            </div>
          </div>
          <Link to="/practice/review" className="shrink-0">
            <Button variant="secondary">
              Open focused review <Icon name="arrowRight" size={15} />
            </Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <Card>
          <SectionHeader
            title="Continue your learning"
            subtitle="Counted from lessons you have actually completed."
          />
          <div className="space-y-4">
            <ProgressRow
              icon="book"
              title="Qaida foundation"
              done={qaidaDone}
              total={qaidaTotal}
              unit="lessons"
              to="/learn/qaida"
            />
            <ProgressRow
              icon="learn"
              title="Tajweed course"
              done={tajweedDone}
              total={tajweedTotal}
              unit="chapters"
              to="/learn/tajweed"
            />
          </div>
        </Card>

        <Card className="border-border bg-surface-1">
          <SectionHeader
            title="Choose a different route"
            subtitle="For when today’s recommendation is not what you need."
          />
          <div className="space-y-1.5">
            <QuickLink
              to="/practice/session"
              icon="practice"
              title="Practice a verse"
              body="Record a target and work through one correction."
            />
            <QuickLink
              to="/practice/articulation"
              icon="wave"
              title="Explore articulation"
              body="Review where each Arabic sound is made."
            />
            <QuickLink
              to="/insights"
              icon="progress"
              title="See your record"
              body="Completed lessons and analysed attempts."
            />
            <QuickLink
              to="/reference/tajweed"
              icon="book"
              title="Look something up"
              body="The full Tajweed reference, rule by rule."
            />
          </div>

          {isDemo && (
            <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-ink-faint">
              You are exploring with a demo persona. Everything works, but progress stays in this
              browser rather than on an account.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function ProgressRow({
  icon,
  title,
  done,
  total,
  unit,
  to,
}: {
  icon: IconName;
  title: string;
  done: number;
  total: number;
  unit: string;
  to: string;
}) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Link
      to={to}
      className="itq-progress-card group block rounded-2xl p-4"
    >
      <div className="flex items-center gap-3">
        <span className="itq-progress-icon grid size-10 shrink-0 place-items-center rounded-xl">
          <Icon name={icon} size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">{title}</p>
            <span className="text-xs font-extrabold tabular-nums text-brand-700 dark:text-emerald-400">
              {done}/{total}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ink-faint">
            {done === 0 ? `Not started — ${total} ${unit}` : `${done} of ${total} ${unit} completed`}
          </p>
        </div>
        <Icon
          name="arrowRight"
          size={16}
          className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand-700 dark:group-hover:text-emerald-400"
        />
      </div>
      <ProgressBar value={percent} className="mt-3" />
    </Link>
  );
}

function QuickLink({
  to,
  icon,
  title,
  body,
}: {
  to: string;
  icon: IconName;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="itq-quicklink group flex items-center gap-3 rounded-xl p-2"
    >
      <span className="itq-quicklink-icon grid size-9 shrink-0 place-items-center rounded-lg">
        <Icon name={icon} size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">{title}</span>
        <span className="block text-xs text-ink-faint">{body}</span>
      </span>
      <Icon
        name="arrowRight"
        size={15}
        className="shrink-0 text-ink-faint group-hover:text-brand-700 dark:group-hover:text-emerald-400"
      />
    </Link>
  );
}
