import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, SectionHeader } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { cn } from '@/lib/cn';

/**
 * PRC-001 Practice Hub — strengthen existing knowledge.
 * Practice is non-linear: the learner may choose any entry point.
 */
export default function PracticePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Practice"
        subtitle="Strengthen what you've learned — no fixed order, just focus."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <PracticeTile
          to="/practice/tajweed"
          icon="practice"
          title="Tajweed Studio"
          body="Recite a verse and receive AI feedback rule by rule."
          tone="brand"
        />
        <PracticeTile
          to="/practice/voice-match"
          icon="sparkle"
          title="Voice Matcher"
          body="Refresh your reference Qari with a fresh voice sample."
          tone="gold"
        />
        <PracticeTile
          to="/learn/qaida"
          icon="book"
          title="Letter & Makhaarij practice"
          body="Isolated articulation drills — arriving with the Qaida module."
          tone="sand"
          disabled
        />
        <PracticeTile
          to="/progress"
          icon="progress"
          title="Revision"
          body="Review past feedback and strengthen your weakest rules."
          tone="sand"
          disabled
        />
      </div>

      <Card className="bg-gradient-to-r from-brand-50 to-transparent">
        <SectionHeader
          title="How practice works"
          subtitle="Four steps, one continuous loop"
        />
        <ol className="grid gap-3 sm:grid-cols-4">
          {[
            { n: 1, t: 'Record', d: 'Recite naturally for a few seconds.' },
            { n: 2, t: 'Analyze', d: 'AI checks timing, rule and clarity.' },
            { n: 3, t: 'Reflect', d: 'Read gentle, specific corrections.' },
            { n: 4, t: 'Repeat', d: 'Retry until the rule feels effortless.' },
          ].map((s) => (
            <li key={s.n} className="rounded-xl bg-surface/80 p-4">
              <span className="grid size-7 place-items-center rounded-full bg-brand-600 text-xs font-extrabold text-white">
                {s.n}
              </span>
              <p className="mt-2.5 text-sm font-bold text-ink">{s.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-faint">{s.d}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function PracticeTile({
  to,
  icon,
  title,
  body,
  tone,
  disabled = false,
}: {
  to: string;
  icon: IconName;
  title: string;
  body: string;
  tone: 'brand' | 'gold' | 'sand';
  disabled?: boolean;
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-600 text-white',
    gold: 'bg-gold-500 text-white',
    sand: 'bg-sand-200 text-sand-500',
  };
  const inner = (
    <>
      <div className={cn('grid size-12 place-items-center rounded-2xl shadow-[var(--shadow-soft)]', tones[tone])}>
        <Icon name={icon} size={22} />
      </div>
      <h3 className={cn('mt-4 text-lg font-bold', disabled ? 'text-ink-soft' : 'text-ink')}>{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-faint">{body}</p>
      <span
        className={cn(
          'mt-4 inline-flex items-center gap-1.5 text-sm font-bold',
          disabled ? 'text-sand-500' : 'text-brand-700 transition-transform group-hover:translate-x-1',
        )}
      >
        {disabled ? 'Coming soon' : 'Open'} <Icon name="arrowRight" size={15} />
      </span>
    </>
  );

  if (disabled) {
    return (
      <div className="group cursor-not-allowed rounded-2xl border border-dashed border-border bg-surface-2/60 p-6">
        {inner}
      </div>
    );
  }
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-[var(--shadow-lift)]"
    >
      {inner}
    </Link>
  );
}
