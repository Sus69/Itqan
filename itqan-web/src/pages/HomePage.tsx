import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, ProgressBar, SectionHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { VERSES } from '@/lib/verses';
import { useAuth } from '@/lib/authContext';

/**
 * HOM-001 Home Dashboard — designed around continuation, not discovery.
 * Answers one question: "What should I do next?"
 */
export default function HomePage() {
  const { user } = useAuth();
  const nextVerse = VERSES[0];

  const displayName = user?.full_name || user?.username || 'Learner';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Assalamu alaikum, ${displayName}`}
        subtitle="Here is your next step toward a more confident, beautiful recitation."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continue learning (CMP-NAV-001) */}
        <Card className="lg:col-span-2 overflow-hidden p-0">
          <div className="rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 p-6 text-white sm:p-8">
            <Badge className="bg-white/15 text-white backdrop-blur">
              <Icon name="learn" size={13} /> Continue Learning
            </Badge>
            <h2 className="mt-3 text-xl font-extrabold sm:text-2xl">
              Tajweed Studio · {nextVerse.surah} {nextVerse.ayah}
            </h2>
            <p
              className="quran-text mt-4 leading-[2.4] text-white/95"
              dir="rtl"
              lang="ar"
              style={{ fontSize: 'clamp(1.3rem, 2vw + 0.4rem, 1.9rem)' }}
            >
              {nextVerse.text}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/practice/tajweed">
                <Button variant="gold" size="lg">
                  <Icon name="mic" size={18} />
                  Start practicing
                </Button>
              </Link>
              <Link to="/learn">
                <Button
                  size="lg"
                  variant="secondary"
                  className="border-white/25 bg-white/10 text-white hover:bg-white/20"
                >
                  View curriculum
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Voice match nudge (HOM-001 Voice Match Pending state) */}
        <Card className="flex flex-col justify-between overflow-hidden bg-gradient-to-b from-gold-50 to-surface">
          <div>
            <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-gold-500 text-white shadow-[var(--shadow-soft)]">
              <Icon name="sparkle" size={22} />
            </div>
            <h3 className="text-lg font-bold text-ink">
              {user?.reference_qari_name ? `Matched Qari: ${user.reference_qari_name}` : 'Find your reference Qari'}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-faint">
              {user?.reference_qari_name
                ? 'Your recitation benchmarks and pronunciation targets are personalized to this Qari.'
                : 'A 30-second voice match personalizes every lesson with a reciter suited to you.'}
            </p>
          </div>
          <Link to="/practice/voice-match" className="mt-5">
            <Button variant="gold" fullWidth>
              <Icon name="mic" size={17} />
              {user?.reference_qari_name ? 'Change reference Qari' : 'Match my voice'}
            </Button>
          </Link>
        </Card>
      </div>

      {/* Daily progress + pillars */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <SectionHeader title="Today's focus" subtitle="Small, consistent steps" />
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-ink">Recitations reviewed</span>
                <span className="font-bold tabular-nums text-brand-700">0 / 3</span>
              </div>
              <ProgressBar value={12} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-ink">Daily Streak</span>
                <span className="font-bold tabular-nums text-brand-700">
                  🔥 {user?.streak_days || 0} days
                </span>
              </div>
              <ProgressBar value={Math.min(100, ((user?.streak_days || 1) / 30) * 100)} tone="gold" />
            </div>
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800">
              Tip: one focused Tajweed recording a day builds lasting confidence.
            </p>
          </div>
        </Card>

        {/* Three pillars (product-ecosystem.md) */}
        <Card className="lg:col-span-2">
          <SectionHeader title="Your recitation ecosystem" subtitle="Three pillars, one journey" />
          <div className="grid gap-3 sm:grid-cols-3">
            <PillarTile
              icon="wave"
              tint="gold"
              title="Voice Matching"
              body="Discover the Qari whose voice naturally matches yours."
              to="/practice/voice-match"
              cta="Start"
            />
            <PillarTile
              icon="book"
              tint="sand"
              title="Qaida"
              body="Learn Arabic reading and articulation from the very beginning."
              to="/learn/qaida"
              cta="Open"
            />
            <PillarTile
              icon="practice"
              tint="brand"
              title="Tajweed"
              body="Recite and receive rule-by-rule AI feedback."
              to="/practice/tajweed"
              cta="Open"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function PillarTile({
  icon,
  tint,
  title,
  body,
  to,
  cta,
  soon = false,
}: {
  icon: 'wave' | 'book' | 'practice';
  tint: 'brand' | 'gold' | 'sand';
  title: string;
  body: string;
  to: string;
  cta: string;
  soon?: boolean;
}) {
  const tints: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    gold: 'bg-gold-100 text-gold-700',
    sand: 'bg-sand-100 text-sand-600',
  };
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[var(--shadow-lift)]"
    >
      <div className={`mb-3 grid size-10 place-items-center rounded-xl ${tints[tint]}`}>
        <Icon name={icon} size={20} />
      </div>
      <h4 className="text-sm font-bold text-ink">{title}</h4>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-faint">{body}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-700 transition-transform group-hover:translate-x-0.5">
        {soon ? 'Coming soon' : cta} <Icon name="arrowRight" size={13} />
      </span>
    </Link>
  );
}
