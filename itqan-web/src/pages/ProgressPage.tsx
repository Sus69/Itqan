import { PageHeader } from '@/components/PageHeader';
import { Card, ProgressBar, ScoreRing, SectionHeader, EmptyState } from '@/components/ui';
import { Icon } from '@/components/Icon';

/**
 * PRG-001 Progress Dashboard — reflection, not competition (vision.md).
 * Currently shows a calm illustrative state; persistence arrives with the DB layer.
 */
export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        subtitle="A clear, honest view of your growth — measured by confidence and accuracy, not streaks."
      />

      {/* Summary row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Recitations reviewed" value="0" hint="All time" />
        <StatCard label="Rules mastered" value="0" hint="Out of 24 taught" />
        <StatCard label="Practice sessions" value="0" hint="This week" />
        <Card className="flex items-center gap-4">
          <ScoreRing value={0} label="Avg score" size={84} stroke={8} />
          <div>
            <p className="text-sm font-bold text-ink">Recitation score</p>
            <p className="text-xs leading-relaxed text-ink-faint">
              Combined text-accuracy, similarity & alignment.
            </p>
          </div>
        </Card>
      </div>

      {/* Rule mastery (PRG-003 Learning analytics) */}
      <Card>
        <SectionHeader
          title="Tajweed rule mastery"
          subtitle="Your understanding across the core rule families"
        />
        <div className="space-y-4">
          {[
            { name: 'Qalqala', ar: 'القلقلة', pct: 0 },
            { name: 'Ghunnah (Noon & Meem Mushaddadah)', ar: 'الغنة', pct: 0 },
            { name: 'Noon Saakin & Tanween', ar: 'أحكام النون الساكنة', pct: 0 },
            { name: 'Meem Saakin', ar: 'أحكام الميم الساكنة', pct: 0 },
            { name: 'Madd (Elongation)', ar: 'المدود', pct: 0 },
            { name: 'Raa — Heavy & Light', ar: 'الراء', pct: 0 },
          ].map((r) => (
            <div key={r.name} className="flex items-center gap-4">
              <div className="w-44 shrink-0">
                <p className="text-sm font-semibold text-ink">{r.name}</p>
                <p className="arabic-text text-xs text-ink-faint" dir="rtl">
                  {r.ar}
                </p>
              </div>
              <ProgressBar value={r.pct} className="flex-1" />
              <span className="w-10 shrink-0 text-right text-sm font-bold tabular-nums text-ink-faint">
                {r.pct}%
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* History empty state */}
      <EmptyState
        icon={<Icon name="progress" size={28} />}
        title="Your recitation history will appear here"
        body="Complete a Tajweed analysis or a voice match and your scores, timestamps, and rule-by-rule trends will be charted here once account sync is enabled."
        className="py-16"
      />
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <p className="text-3xl font-extrabold tabular-nums tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-sm font-semibold text-ink-soft">{label}</p>
      <p className="text-xs text-ink-faint">{hint}</p>
    </Card>
  );
}
