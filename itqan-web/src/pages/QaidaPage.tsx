import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

/**
 * QAD-001 Qaida Home — intentionally minimal per current scope.
 * Full letter grid + Makhaarij diagrams arrive with the Qaida engine.
 */
export default function QaidaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Qaida — Learn Arabic Reading"
        subtitle="Pillar 2 · Foundation for every reciter"
      />

      <EmptyState
        icon={<Icon name="book" size={28} />}
        title="The Qaida course is being crafted"
        body="Soon you'll learn Arabic letters, vowels, joining, and the places of articulation (Makhaarij) with interactive diagrams and instant pronunciation feedback. Until then, begin your journey with Tajweed practice."
        action={
          <Link to="/practice/tajweed">
            <Button>
              <Icon name="practice" size={17} />
              Open Tajweed Studio
            </Button>
          </Link>
        }
        className="py-20"
      />

      {/* Quiet roadmap preview — information only, no clutter */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { t: 'Arabic letters', d: 'Recognize & pronounce every letter in all its forms.' },
          { t: 'Makhaarij', d: 'Master the 17 points of articulation from throat to lips.' },
          { t: 'Reading fluency', d: 'Join vowels and Sukoon to read words confidently.' },
        ].map((s) => (
          <div key={s.t} className="rounded-2xl border border-dashed border-border bg-surface-2/60 p-5">
            <p className="text-sm font-bold text-ink-soft">{s.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-faint">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
