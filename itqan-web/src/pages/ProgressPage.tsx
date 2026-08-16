import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, ProgressBar, ScoreRing, SectionHeader, EmptyState, Button, Badge } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/lib/authContext';
import {
  getUserProgressOverview,
  getUserRecitations,
  type UserStatsResponse,
  type RecitationHistoryItem,
} from '@/lib/api';

export default function ProgressPage() {
  const { user, token, openAuthModal } = useAuth();

  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [recitations, setRecitations] = useState<RecitationHistoryItem[]>([]);

  useEffect(() => {
    if (!token) {
      setStats(null);
      setRecitations([]);
      return;
    }

    async function loadData() {
      try {
        const [statsData, recData] = await Promise.all([
          getUserProgressOverview(token!),
          getUserRecitations(token!),
        ]);
        setStats(statsData);
        setRecitations(recData.recitations);
      } catch (err) {
        console.error('Failed to load user progress:', err);
      }
    }

    loadData();
  }, [token]);

  const masteredCount = stats?.progress_items.filter((p) => p.mastery_level === 'mastered').length || 0;
  const avgScore =
    recitations.length > 0
      ? Math.round(recitations.reduce((acc, r) => acc + r.accuracy_score, 0) / recitations.length)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Mastery & Progress"
          subtitle="A comprehensive view of your recitation accuracy, Tajweed rules mastered, and practice logs."
        />

        {!user && (
          <Button variant="primary" className="text-xs shrink-0" onClick={() => openAuthModal('demo')}>
            ⭐ Load Demo Progress
          </Button>
        )}
      </div>

      {/* Summary row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Recitations Logged"
          value={stats ? String(stats.total_recitations) : '0'}
          hint="Total analyzed Ayahs"
        />
        <StatCard
          label="Lessons Mastered"
          value={stats ? String(masteredCount) : '0'}
          hint="Tajweed & Qaida rules"
        />
        <StatCard
          label="Practice Streak"
          value={user ? `${user.streak_days} Days` : '0 Days'}
          hint={user ? `Target: ${user.target_daily_minutes}m/day` : 'Sign in to track'}
        />
        <Card className="flex items-center gap-4">
          <ScoreRing value={avgScore} label="Avg score" size={80} stroke={7} />
          <div>
            <p className="text-sm font-bold text-ink">Recitation Score</p>
            <p className="text-xs text-ink-soft leading-relaxed">
              Overall phonetic accuracy & Tajweed compliance.
            </p>
          </div>
        </Card>
      </div>

      {/* Curriculum Mastery Breakdown */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <SectionHeader
            title="Tajweed Mastery Progress"
            subtitle={`${stats?.tajweed_mastery_percentage || 0}% overall syllabus completion`}
          />
          <ProgressBar value={stats?.tajweed_mastery_percentage || 0} className="h-3" />

          <div className="space-y-3 pt-2">
            {[
              { name: 'Makharij al-Huroof (Articulation)', ar: 'مخارج الحروف', pct: user?.username === 'ahmed_qari' ? 95 : user?.username === 'fatima_reciter' ? 90 : 80 },
              { name: 'Sifaat al-Huroof (Characteristics)', ar: 'صفات الحروف', pct: user?.username === 'ahmed_qari' ? 90 : user?.username === 'fatima_reciter' ? 85 : 40 },
              { name: 'Noon Saakin & Tanween', ar: 'أحكام النون الساكنة', pct: user?.username === 'ahmed_qari' ? 88 : user?.username === 'fatima_reciter' ? 75 : 30 },
              { name: 'Meem Saakin Rules', ar: 'أحكام الميم الساكنة', pct: user?.username === 'ahmed_qari' ? 92 : user?.username === 'fatima_reciter' ? 60 : 0 },
              { name: 'Ahkam al-Madd (Elongations)', ar: 'أحكام المدود', pct: user?.username === 'ahmed_qari' ? 95 : user?.username === 'fatima_reciter' ? 40 : 0 },
              { name: 'Ahkam ar-Raa & Waqf', ar: 'الراء والوقف', pct: user?.username === 'ahmed_qari' ? 85 : 0 },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-3">
                <div className="w-48 shrink-0">
                  <p className="text-xs font-bold text-ink">{r.name}</p>
                  <p className="arabic-text text-[11px] text-ink-soft" dir="rtl">
                    {r.ar}
                  </p>
                </div>
                <ProgressBar value={r.pct} className="flex-1" />
                <span className="w-10 shrink-0 text-right text-xs font-bold text-ink-soft">
                  {r.pct}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Qaida Foundation Mastery */}
        <Card className="space-y-4">
          <SectionHeader
            title="Madani Qa'idah Progress"
            subtitle={`${stats?.qaida_mastery_percentage || 0}% foundational reader completion`}
          />
          <ProgressBar value={stats?.qaida_mastery_percentage || 0} tone="gold" className="h-3" />

          <div className="space-y-3 pt-2">
            {[
              { name: 'Lessons 1–4: Individual & Compound Alphabets', pct: user?.username === 'ahmed_qari' ? 100 : user?.username === 'fatima_reciter' ? 100 : 95 },
              { name: 'Lessons 5–8: Tanween & Letters of Maddah', pct: user?.username === 'ahmed_qari' ? 100 : user?.username === 'fatima_reciter' ? 90 : 80 },
              { name: 'Lessons 9–12: Leen, Sukoon & Qalqalah', pct: user?.username === 'ahmed_qari' ? 100 : user?.username === 'fatima_reciter' ? 70 : 0 },
              { name: 'Lessons 13–16: Tashdeed & Meem Rules', pct: user?.username === 'ahmed_qari' ? 95 : user?.username === 'fatima_reciter' ? 40 : 0 },
              { name: 'Lessons 17–21: Maddaat, Waqf & Noon Qutni', pct: user?.username === 'ahmed_qari' ? 90 : 0 },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-3">
                <div className="w-56 shrink-0">
                  <p className="text-xs font-bold text-ink">{r.name}</p>
                </div>
                <ProgressBar value={r.pct} tone="gold" className="flex-1" />
                <span className="w-10 shrink-0 text-right text-xs font-bold text-ink-soft">
                  {r.pct}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recitation History Logs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            title="Recent Recitation Logs"
            subtitle="Audio analysis timestamps, accuracy scores, and rule verification results"
          />
          {recitations.length > 0 && (
            <Badge tone="brand">{recitations.length} Recorded Recitations</Badge>
          )}
        </div>

        {recitations.length > 0 ? (
          <div className="divide-y divide-border">
            {recitations.map((rec) => (
              <div key={rec.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="arabic-text text-base font-bold text-brand-900" dir="rtl">
                    {rec.target_text}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-ink-soft">
                    <span>Duration: {rec.audio_duration_seconds}s</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-semibold">✓ {rec.passed_rules_count} rules passed</span>
                    {rec.failed_rules_count > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-amber-700 font-semibold">⚠ {rec.failed_rules_count} need practice</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-lg font-black text-ink">{Math.round(rec.accuracy_score)}%</span>
                    <p className="text-[10px] text-ink-soft">Accuracy</p>
                  </div>
                  <Badge tone={rec.accuracy_score >= 90 ? 'brand' : 'gold'}>
                    {rec.accuracy_score >= 90 ? 'Excellent' : 'Good'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Icon name="progress" size={28} />}
            title="No recitations logged yet"
            body="Start practicing in the Tajweed Studio or Voice Matcher to log real-time evaluations."
            className="py-12"
          />
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <p className="text-3xl font-extrabold tabular-nums tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-sm font-semibold text-ink-soft">{label}</p>
      <p className="text-xs text-ink-soft">{hint}</p>
    </Card>
  );
}
