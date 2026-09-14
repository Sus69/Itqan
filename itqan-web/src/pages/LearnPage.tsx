import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { cn } from '@/lib/cn';
import { loadCourseProgress } from '@/lib/courseState';
import { loadQaidaState } from '@/lib/qaidaState';
import { QAIDA_LESSONS } from '@/lib/qaidaData';
import { TAJWEED_INFO_CHAPTERS } from '@/lib/infoData';

/**
 * The learning hub — two sequenced courses, nothing else.
 *
 * Open practice and revision live under Practice, so this page never competes
 * with them. Each card carries its own continue action, which is why there is no
 * separate "next session" banner repeating the same link a third time.
 */
export default function LearnPage() {
  const [{ course, qaida }] = useState(() => ({
    course: loadCourseProgress(),
    qaida: loadQaidaState(),
  }));

  const qaidaDone = qaida.completedLessonIds.length;
  const qaidaTotal = QAIDA_LESSONS.length;
  const nextQaida =
    QAIDA_LESSONS.find((l) => !qaida.completedLessonIds.includes(l.id)) ?? QAIDA_LESSONS[0];

  const tajweedDone = course.completedChapterIds.length;
  const tajweedTotal = TAJWEED_INFO_CHAPTERS.length;
  const nextChapter =
    TAJWEED_INFO_CHAPTERS.find((c) => !course.completedChapterIds.includes(c.id)) ??
    TAJWEED_INFO_CHAPTERS[0];

  return (
    <div className="anim-fade-up mx-auto max-w-shell space-y-6">
      <PageHeader
        title="Choose a learning path"
        subtitle="Follow a clear sequence when you want to build a new skill. Open practice and revision live separately, under Practice."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <CourseCard
          to="/learn/qaida"
          badge={`Foundation · ${qaidaTotal} lessons`}
          icon="sparkle"
          title="Madani Qa'idah — Arabic literacy"
          arabic="الْقَاعِدَةُ الْمَدَنِيَّة"
          body="Build Arabic reading from letters through fluency. Each lesson holds one focused skill, guided listening, practice, and a short check."
          done={qaidaDone}
          total={qaidaTotal}
          unit="lessons"
          continueTo={`/learn/qaida/lesson/${nextQaida.id}`}
          continueLabel={
            qaidaDone === 0
              ? `Start lesson ${nextQaida.id}`
              : qaidaDone >= qaidaTotal
                ? 'Revisit any lesson'
                : `Continue lesson ${nextQaida.id}`
          }
        />

        <CourseCard
          to="/learn/tajweed"
          badge={`Structured course · ${tajweedTotal} chapters`}
          icon="book"
          title="Tajweed course — recite correctly"
          arabic="دورة إتقان التجويد"
          body="Learn one rule, see it in context, then recite a short extract and receive a single clear correction."
          done={tajweedDone}
          total={tajweedTotal}
          unit="chapters"
          continueTo={`/learn/tajweed/lesson/${nextChapter.id}`}
          continueLabel={
            tajweedDone === 0
              ? `Start chapter ${nextChapter.chapterNumber}`
              : tajweedDone >= tajweedTotal
                ? 'Revisit any chapter'
                : `Continue chapter ${nextChapter.chapterNumber}`
          }
        />
      </div>

      <Card className="flex flex-col items-start justify-between gap-4 border-dashed bg-surface-2/60 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">Already know what you want to work on?</p>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-ink-faint">
            Choose a verse, revisit a recent correction, or review a point of articulation — none of
            it changes your course progress.
          </p>
        </div>
        <Link to="/practice" className="shrink-0">
          <Button variant="secondary">
            <Icon name="practice" size={16} /> Go to practice
          </Button>
        </Link>
      </Card>
    </div>
  );
}

function CourseCard({
  to,
  badge,
  icon,
  title,
  arabic,
  body,
  done,
  total,
  unit,
  continueTo,
  continueLabel,
}: {
  to: string;
  badge: string;
  icon: IconName;
  title: string;
  arabic: string;
  body: string;
  done: number;
  total: number;
  unit: string;
  continueTo: string;
  continueLabel: string;
}) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-[var(--shadow-soft)]">
          <Icon name={icon} size={22} />
        </span>
        <Badge tone="brand">{badge}</Badge>
      </div>

      <h3 className="mt-5 text-lg font-extrabold text-ink">{title}</h3>
      <p className="arabic-text mt-0.5 text-base text-ink-faint" dir="rtl" lang="ar">
        {arabic}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-faint">{body}</p>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="text-ink-faint">
            {done} of {total} {unit} completed
          </span>
          <span className="tabular-nums text-brand-700">{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-sand-200">
          <div
            className={cn('h-full rounded-full bg-brand-600')}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link to={continueTo}>
          <Button>
            <Icon name="play" size={15} /> {continueLabel}
          </Button>
        </Link>
        <Link
          to={to}
          className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline"
        >
          See all {unit}
        </Link>
      </div>
    </Card>
  );
}
