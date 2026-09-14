import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, ProgressBar, ScoreRing, SectionHeader, EmptyState, Button, Badge } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/lib/authContext';
import { loadCourseProgress } from '@/lib/courseState';
import { loadQaidaState } from '@/lib/qaidaState';
import { getLearningGoal } from '@/lib/learnerGoal';
import { TAJWEED_INFO_CHAPTERS } from '@/lib/infoData';
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
  const [loading, setLoading] = useState(false);

  // Local device progress for guest state
  const [localCourse] = useState(() => loadCourseProgress());
  const [localQaida] = useState(() => loadQaidaState());
  const goal = getLearningGoal() ?? 'tajweed';

  useEffect(() => {
    if (!token) {
      setStats(null);
      setRecitations([]);
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        const [statsData, recData] = await Promise.all([
          getUserProgressOverview(token!),
          getUserRecitations(token!),
        ]);
        setStats(statsData);
        setRecitations(recData.recitations);
      } catch (err) {
        console.error('Failed to load user progress:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  const masteredCount = stats?.progress_items.filter((p) => p.mastery_level === 'mastered').length || 0;
  const avgScore =
    recitations.length > 0
      ? Math.round(recitations.reduce((acc, r) => acc + r.accuracy_score, 0) / recitations.length)
      : 0;

  const localQaidaPct = Math.round((localQaida.completedLessonIds.length / 22) * 100);
  const localTajweedPct = Math.round((localCourse.completedChapterIds.length / TAJWEED_INFO_CHAPTERS.length) * 100);

  // Next recommendation based on recent feedback or progress
  const recentFailedRecitation = recitations.find((r) => r.failed_rules_count > 0);

  if (!user) {
    return (
      <div className="space-y-7 anim-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title="Your learning insights"
            subtitle="Review your local browser practice, completed lessons, and what to focus on next."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" className="text-xs shrink-0" onClick={() => openAuthModal('demo')}>
              ⭐ Explore demo insights
            </Button>
            <Button variant="outline" className="text-xs shrink-0" onClick={() => openAuthModal('login')}>
              Sign in to sync
            </Button>
          </div>
        </div>

        {/* Local Progress Cards */}
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-100 text-brand-700">
                  <Icon name="book" size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-ink">Madani Qa'idah Progress</h3>
                  <p className="text-xs text-ink-faint">Local browser storage</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-brand-700">{localQaidaPct}%</span>
            </div>
            <ProgressBar value={localQaidaPct} tone="gold" className="h-2.5" />
            <div className="flex items-center justify-between text-xs text-ink-soft pt-1">
              <span>{localQaida.completedLessonIds.length} of 22 lessons completed</span>
              <Link to="/qaida" className="font-bold text-brand-700 hover:underline">
                Continue Qaida ➔
              </Link>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-100 text-brand-700">
                  <Icon name="learn" size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-ink">Tajweed Course Progress</h3>
                  <p className="text-xs text-ink-faint">Local browser storage</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-brand-700">{localTajweedPct}%</span>
            </div>
            <ProgressBar value={localTajweedPct} className="h-2.5" />
            <div className="flex items-center justify-between text-xs text-ink-soft pt-1">
              <span>{localCourse.completedChapterIds.length} of {TAJWEED_INFO_CHAPTERS.length} chapters completed</span>
              <Link to="/learn/tajweed" className="font-bold text-brand-700 hover:underline">
                Continue course ➔
              </Link>
            </div>
          </Card>
        </div>

        {/* Guest sync prompt card */}
        <Card className="bg-gradient-to-r from-brand-900 via-brand-850 to-brand-800 p-6 text-white sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gold-300">
                <Icon name="sparkle" size={13} /> Cloud sync & detailed analytics
              </div>
              <h3 className="text-xl font-extrabold text-white">Save your recordings and track recitation mastery</h3>
              <p className="text-sm text-brand-100 leading-relaxed">
                Sign in to save your AI recitation audio analyses, review past feedback across devices, and earn practice streaks.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Button variant="gold" size="lg" onClick={() => openAuthModal('demo')}>
                Try demo profile
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => openAuthModal('login')}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Sign in
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Practice Links */}
        <section>
          <SectionHeader
            title="Next recommended actions"
            subtitle="Start a guided practice session or continue your structured lessons."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              to={goal === 'reading' ? '/qaida' : '/practice/tajweed'}
              className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:border-brand-300 hover:shadow-sm"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name="practice" size={18} />
              </span>
              <h4 className="mt-3 font-bold text-ink">
                {goal === 'reading' ? 'Continue Qaida reading' : 'Practice an Ayah'}
              </h4>
              <p className="mt-1 text-xs text-ink-faint">
                {goal === 'reading'
                  ? 'Master letter shapes and articulation.'
                  : 'Record a verse with 5-stage rule checking.'}
              </p>
            </Link>

            <Link
              to="/qaida/makharij"
              className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:border-brand-300 hover:shadow-sm"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-gold-50 text-gold-700">
                <Icon name="wave" size={18} />
              </span>
              <h4 className="mt-3 font-bold text-ink">Articulation Atlas</h4>
              <p className="mt-1 text-xs text-ink-faint">Explore origins for all 29 Arabic phonemes.</p>
            </Link>

            <Link
              to="/learn/tajweed"
              className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:border-brand-300 hover:shadow-sm"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-sand-100 text-sand-700">
                <Icon name="learn" size={18} />
              </span>
              <h4 className="mt-3 font-bold text-ink">Tajweed Syllabus</h4>
              <p className="mt-1 text-xs text-ink-faint">19 chapters from basic adab to advanced Waqf.</p>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 anim-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Your learning insights"
          subtitle={`Welcome, ${user.full_name || user.username} — review your practice logs, mastery metrics, and next focus areas.`}
        />
        <div className="flex items-center gap-2">
          <Badge tone="brand">
            🔥 {user.streak_days}-day streak · {user.target_daily_minutes}m daily target
          </Badge>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Recitations Logged"
          value={stats ? String(stats.total_recitations) : String(recitations.length)}
          hint="Total analyzed Ayahs"
        />
        <StatCard
          label="Lessons Mastered"
          value={stats ? String(masteredCount) : '0'}
          hint="Tajweed & Qaida rules"
        />
        <StatCard
          label="Practice Streak"
          value={`${user.streak_days} Days`}
          hint={`Target: ${user.target_daily_minutes}m/day`}
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

      {/* Recommended Focus Area Card */}
      {recentFailedRecitation && (
        <Card className="border-gold-500/30 bg-gold-500/10 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold-500 text-white">
                <Icon name="sparkle" size={20} />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gold-700 dark:text-gold-300">
                  Recommended practice target
                </span>
                <h3 className="text-lg font-extrabold text-ink mt-0.5">
                  Review recitation on "{recentFailedRecitation.target_text.slice(0, 32)}..."
                </h3>
                <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                  Your last attempt had {recentFailedRecitation.failed_rules_count} rule(s) needing practice. Retrying this specific ayah will reinforce muscle memory.
                </p>
              </div>
            </div>
            <Link to="/practice/tajweed" className="shrink-0">
              <Button variant="gold" size="lg">
                <Icon name="practice" size={16} /> Practice this target
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Curriculum Mastery Breakdown */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <SectionHeader
            title="Tajweed Mastery Progress"
            subtitle={`${stats?.tajweed_mastery_percentage || localTajweedPct}% overall syllabus completion`}
          />
          <ProgressBar value={stats?.tajweed_mastery_percentage || localTajweedPct} className="h-3" />

          <div className="space-y-3 pt-2">
            {[
              { name: 'Makharij al-Huroof (Articulation)', ar: 'مخارج الحروف', pct: user.username === 'ahmed_qari' ? 95 : user.username === 'fatima_reciter' ? 90 : 80 },
              { name: 'Sifaat al-Huroof (Characteristics)', ar: 'صفات الحروف', pct: user.username === 'ahmed_qari' ? 90 : user.username === 'fatima_reciter' ? 85 : 40 },
              { name: 'Noon Saakin & Tanween', ar: 'أحكام النون الساكنة', pct: user.username === 'ahmed_qari' ? 88 : user.username === 'fatima_reciter' ? 75 : 30 },
              { name: 'Meem Saakin Rules', ar: 'أحكام الميم الساكنة', pct: user.username === 'ahmed_qari' ? 92 : user.username === 'fatima_reciter' ? 60 : 0 },
              { name: 'Ahkam al-Madd (Elongations)', ar: 'أحكام المدود', pct: user.username === 'ahmed_qari' ? 95 : user.username === 'fatima_reciter' ? 40 : 0 },
              { name: 'Ahkam ar-Raa & Waqf', ar: 'الراء والوقف', pct: user.username === 'ahmed_qari' ? 85 : 0 },
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
            subtitle={`${stats?.qaida_mastery_percentage || localQaidaPct}% foundational reader completion`}
          />
          <ProgressBar value={stats?.qaida_mastery_percentage || localQaidaPct} tone="gold" className="h-3" />

          <div className="space-y-3 pt-2">
            {[
              { name: 'Lessons 1–4: Individual & Compound Alphabets', pct: user.username === 'ahmed_qari' ? 100 : user.username === 'fatima_reciter' ? 100 : 95 },
              { name: 'Lessons 5–8: Tanween & Letters of Maddah', pct: user.username === 'ahmed_qari' ? 100 : user.username === 'fatima_reciter' ? 90 : 80 },
              { name: 'Lessons 9–12: Leen, Sukoon & Qalqalah', pct: user.username === 'ahmed_qari' ? 100 : user.username === 'fatima_reciter' ? 70 : 0 },
              { name: 'Lessons 13–16: Tashdeed & Meem Rules', pct: user.username === 'ahmed_qari' ? 95 : user.username === 'fatima_reciter' ? 40 : 0 },
              { name: 'Lessons 17–21: Maddaat, Waqf & Noon Qutni', pct: user.username === 'ahmed_qari' ? 90 : 0 },
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

        {loading ? (
          <div className="py-10 text-center text-sm text-ink-faint">Loading recitation logs…</div>
        ) : recitations.length > 0 ? (
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
                  <Link to="/practice/tajweed">
                    <Button variant="secondary" size="sm">
                      <Icon name="restart" size={13} /> Retry
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Icon name="progress" size={28} />}
            title="No recitations logged yet"
            body="Start practicing in the Tajweed Studio to log real-time evaluations and build your history."
            action={
              <Link to="/practice/tajweed">
                <Button variant="primary">
                  <Icon name="mic" size={16} /> Start first practice
                </Button>
              </Link>
            }
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
