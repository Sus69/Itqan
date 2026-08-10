import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card } from '@/components/ui';
import { Icon } from '@/components/Icon';

/**
 * PRO-001 Profile — personal settings, reference Qari, preferences.
 * Auth arrives with the DB layer; this is a graceful read-only shell.
 */
export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your identity, reference Qari, and preferences." />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="flex flex-col items-center py-8 text-center">
          <div className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-2xl font-extrabold text-white shadow-[var(--shadow-lift)]">
            H
          </div>
          <h3 className="mt-4 text-lg font-bold text-ink">Guest learner</h3>
          <p className="mt-1 text-xs text-ink-faint">Profile sync & sign-in arriving with the account update</p>
          <Badge tone="brand" className="mt-4">
            Free learner
          </Badge>
        </Card>

        {/* Reference Qari */}
        <Card className="lg:col-span-2">
          <h3 className="text-base font-bold text-ink">Reference Qari</h3>
          <p className="mt-1 text-sm text-ink-faint">
            The reciter whose voice best matches yours guides every Tajweed lesson.
          </p>
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-center">
            <Icon name="wave" size={26} className="mx-auto text-brand-600" />
            <p className="mt-3 text-sm font-semibold text-ink">No reference Qari selected yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-ink-faint">
              Complete a 30-second voice match to discover the reciter whose voice naturally resembles yours.
            </p>
            <Link to="/practice/voice-match">
              <Button variant="gold" className="mt-4">
                <Icon name="sparkle" size={16} />
                Match my voice
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Preferences */}
      <Card>
        <h3 className="mb-4 text-base font-bold text-ink">Preferences</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <PrefRow title="App language" value="English" />
          <PrefRow title="Recitation riwayah" value="Hafs 'an 'Asim" />
          <PrefRow title="Feedback pace" value="Gentle & detailed" />
          <PrefRow title="Theme" value="Light (only mode)" />
        </div>
        <p className="mt-4 rounded-lg bg-surface-2 px-3.5 py-2.5 text-xs text-ink-faint">
          Full settings — notifications, accessibility (text scaling, reduced motion), and language —
          will unlock with the account & sync update.
        </p>
      </Card>
    </div>
  );
}

function PrefRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
      <span className="text-sm font-semibold text-ink-soft">{title}</span>
      <span className="text-sm font-bold text-ink">{value}</span>
    </div>
  );
}
