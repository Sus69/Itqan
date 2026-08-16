import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, SectionHeader } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { cn } from '@/lib/cn';
import { VERSES } from '@/lib/verses';
import { loadCourseProgress, type CourseProgressState } from '@/lib/courseState';
import { TAJWEED_INFO_CHAPTERS } from '@/lib/infoData';

/**
 * LRN-001 Learning Hub.
 * Deliver structured content: Qaida (placeholder) + Tajweed Course.
 */
export default function LearnPage() {
  const [progress] = useState<CourseProgressState>(() => loadCourseProgress());

  const total = TAJWEED_INFO_CHAPTERS.length;
  const completed = progress.completedChapterIds.length;
  const pct = Math.round((completed / total) * 100);

  const activeChap =
    TAJWEED_INFO_CHAPTERS.find((c) => c.id === progress.activeChapterId) ||
    TAJWEED_INFO_CHAPTERS[0];

  return (
    <div className="space-y-6 anim-fade-up">
      <PageHeader
        title="Learn"
        subtitle="Structured learning paths: read Arabic with Qaida, then master Quranic recitation with the Tajweed Masterclass."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {/* Qaida course card */}
        <CourseCard
          to="/qaida"
          badge="Pillar 2 · 22 Lessons Live"
          badgeTone="brand"
          icon="sparkle"
          title="Madani Qa'idah — Arabic Literacy"
          arabic="الْقَاعِدَةُ الْمَدَنِيَّة"
          body="Master letters, vowels, articulation points (Makhaarij), and Quranic fluency across 22 interactive lessons with audio spelling breakdown."
          progress={0}
        />

        {/* Tajweed masterclass course card */}
        <CourseCard
          to="/learn/tajweed"
          badge="Pillar 3 · 19 Chapters Live"
          badgeTone="brand"
          icon="book"
          title="Tajweed Masterclass — Recite Correctly"
          arabic="دورة إتقان التجويد"
          body={`Step-by-step 19-chapter curriculum with Theory, Practice Verses, and AI Recitation Testing. Currently on Chapter ${activeChap.chapterNumber}: ${activeChap.title}.`}
          progress={pct}
        />
      </div>

      {/* Tajweed course CTA banner */}
      <Card className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-300">
              Interactive 3-Step Course
            </span>
            <h3 className="text-xl font-extrabold text-white">
              {completed > 0 ? `Resume Chapter ${activeChap.chapterNumber}: ${activeChap.title}` : 'Begin Chapter 1: The Aadaab of Reciting the Holy Qur’an'}
            </h3>
            <p className="text-sm text-brand-100/90 leading-relaxed">
              Every chapter features Theory ➔ Practice Verses ➔ AI Recitation Test with instant Tajweed score rings.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to={`/learn/tajweed/lesson/${activeChap.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-3 text-xs font-extrabold text-white shadow-lg transition-transform hover:scale-105"
            >
              <Icon name="play" size={16} /> Continue Course ➔
            </Link>
            <Link
              to="/learn/tajweed"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 px-4 py-3 text-xs font-bold text-white backdrop-blur hover:bg-white/25"
            >
              <Icon name="book" size={16} /> Course Syllabus
            </Link>
          </div>
        </div>
      </Card>

      {/* Tajweed practice verses preview */}
      <Card>
        <SectionHeader
          title="Practice verses"
          subtitle="Begin with any verse below — each opens the Tajweed Studio"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {VERSES.map((v) => (
            <Link
              key={v.id}
              to={`/practice/tajweed?verse=${v.id}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name="note" size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink">
                    {v.surah} · {v.ayah}
                  </p>
                  <Badge tone="neutral">{v.difficulty}</Badge>
                </div>
                <p className="arabic-text mt-1 line-clamp-1 text-sm text-ink-soft" dir="rtl">
                  {v.text}
                </p>
              </div>
              <Icon
                name="arrowRight"
                size={17}
                className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand-600"
              />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CourseCard({
  to,
  badge,
  badgeTone,
  icon,
  title,
  arabic,
  body,
  progress,
  locked = false,
}: {
  to: string;
  badge: string;
  badgeTone: 'brand' | 'sand';
  icon: IconName;
  title: string;
  arabic: string;
  body: string;
  progress: number;
  locked?: boolean;
}) {
  return (
    <Link
      to={to}
      aria-disabled={locked}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border p-6 transition-all',
        locked
          ? 'border-dashed border-border bg-surface-2/70'
          : 'border-border bg-surface hover:-translate-y-1 hover:border-brand-300 hover:shadow-[var(--shadow-lift)]',
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'grid size-12 place-items-center rounded-2xl',
            locked ? 'bg-sand-200 text-sand-500' : 'bg-brand-600 text-white shadow-[var(--shadow-soft)]',
          )}
        >
          <Icon name={icon} size={22} />
        </div>
        <Badge tone={badgeTone === 'brand' ? 'brand' : 'neutral'}>{badge}</Badge>
      </div>

      <h3 className={cn('mt-5 text-lg font-extrabold', locked ? 'text-ink-soft' : 'text-ink')}>
        {title}
      </h3>
      <p className="arabic-text mt-0.5 text-base text-ink-faint" dir="rtl">
        {arabic}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-faint">{body}</p>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="text-ink-faint">Progress</span>
          <span className={locked ? 'text-sand-500' : 'text-brand-700'}>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-sand-200">
          <div
            className={cn('h-full rounded-full', locked ? 'bg-sand-300' : 'bg-brand-600')}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {locked && (
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sand-200 px-3 py-1 text-[11px] font-bold text-sand-600">
          <Icon name="info" size={12} /> In development
        </span>
      )}
    </Link>
  );
}
