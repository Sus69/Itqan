import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, SectionHeader } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { cn } from '@/lib/cn';
import { VERSES } from '@/lib/verses';

/**
 * LRN-001 Learning Hub.
 * Deliver structured content: Qaida (placeholder) + Tajweed.
 */
export default function LearnPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Learn"
        subtitle="Structured paths: read Arabic from scratch with Qaida, then perfect it with Tajweed."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {/* Qarda course card (empty / coming soon by request) */}
        <CourseCard
          to="/learn/qaida"
          badge="Pillar 2 · Coming soon"
          badgeTone="sand"
          icon="book"
          title="Qaida — Learn Arabic Reading"
          arabic="القاعدة النورانية"
          body="Master letters, vowels, and the places of articulation (Makhaarij) from zero. This course opens in a future update."
          progress={0}
          locked
        />

        {/* Tajweed course card */}
        <CourseCard
          to="/practice/tajweed"
          badge="Pillar 3 · Live"
          badgeTone="brand"
          icon="practice"
          title="Tajweed — Recite Correctly"
          arabic="التجويد"
          body={`Practice ${VERSES.length} curated verses with rule-by-rule AI feedback: Qalqala, Ghunnah, Madd, Noon Saakin & more.`}
          progress={18}
        />
      </div>

      {/* Tajweed module preview (TAJ-002) */}
      <Card>
        <SectionHeader
          title="Practice verses"
          subtitle="Begin with any verse below — each opens the Tajweed Studio"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {VERSES.map((v) => (
            <Link
              key={v.id}
              to="/practice/tajweed"
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
