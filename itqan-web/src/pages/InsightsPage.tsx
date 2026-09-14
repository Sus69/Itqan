import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getUserProgressOverview,
  getUserRecitations,
  type RecitationHistoryItem,
  type UserStatsResponse,
} from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  InlineNotice,
  ProgressBar,
  SectionHeader,
  SkeletonList,
} from '@/components/ui';
import { Icon } from '@/components/Icon';
import { QAIDA_LESSONS } from '@/lib/qaidaData';
import { TAJWEED_INFO_CHAPTERS } from '@/lib/infoData';
import { loadCourseProgress } from '@/lib/courseState';
import { loadQaidaState } from '@/lib/qaidaState';
import { averageScore, loadAttempts, weakRules, type AttemptRecord } from '@/lib/sessionLog';
import { relativeTime } from '@/lib/format';
import { PASS_THRESHOLD } from '@/lib/feedback';

/**
 * Insights.
 *
 * Every number here is traceable to something the learner did:
 *  - lesson counts come from the local course/Qaida state,
 *  - attempt scores come from the analysis engine via the local attempt log,
 *  - account figures come from the backend and are labelled as such.
 *
 * Where a figure cannot be computed, the page says so instead of showing a
 * plausible-looking placeholder. The previous version hardcoded mastery bars per
 * demo username, which is exactly what this page must never do.
 */
export default function InsightsPage() {
  const { user, token, openAuthModal } = useAuth();

  const [attempts, setAttempts] = useState<AttemptRecord[] | null>(null);
  const [serverStats, setServerStats] = useState<UserStatsResponse | null>(null);
  const [recitations, setRecitations] = useState<RecitationHistoryItem[] | null>(null);
  const [serverState, setServerState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  // Read once on mount: local state does not change while this page is open.
  const [local] = useState(() => ({
    course: loadCourseProgress(),
    qaida: loadQaidaState(),
  }));

  useEffect(() => {
    setAttempts(loadAttempts());
  }, []);

  const loadServer = useCallback(async () => {
    if (!token || token.startsWith('demo_token_')) {
      setServerState('idle');
      return;
    }
    setServerState('loading');
    try {
      const [stats, history] = await Promise.all([
        getUserProgressOverview(token),
        getUserRecitations(token, 10),
      ]);
      setServerStats(stats);
      setRecitations(history.recitations);
      setServerState('ready');
    } catch {
      setServerState('error');
    }
  }, [token]);

  useEffect(() => {
    void loadServer();
  }, [loadServer]);

  const tajweedDone = local.course.completedChapterIds.length;
  const tajweedTotal = TAJWEED_INFO_CHAPTERS.length;
  const qaidaDone = local.qaida.completedLessonIds.length;
  const qaidaTotal = QAIDA_LESSONS.length;

  const records = attempts ?? [];
  const avg = averageScore(records);
  const outstanding = weakRules(records).length;
  const passing = records.filter((r) => r.score >= PASS_THRESHOLD).length;
  const loadingAttempts = attempts === null;

  return (
    <div className="anim-fade-up mx-auto max-w-shell space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Insights</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {user ? `${user.full_name.split(' ')[0]}, here is your record` : 'Your record'}
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
          Only measured activity appears here. Lessons count when you complete them; scores come from
          the analysis engine.
        </p>
      </div>

      {/* --- Course completion: countable, so stated exactly. --- */}
      <section>
        <SectionHeader
          title="Course completion"
          subtitle="Counted from lessons you finished on this device."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CourseCard
            title="Tajweed course"
            done={tajweedDone}
            total={tajweedTotal}
            to="/learn/tajweed"
            cta="Continue Tajweed"
          />
          <CourseCard
            title="Madani Qaida"
            done={qaidaDone}
            total={qaidaTotal}
            to="/learn/qaida"
            cta="Continue Qaida"
          />
        </div>
      </section>

      {/* --- Recitation record from the attempt log. --- */}
      <section>
        <SectionHeader
          title="Recitation record"
          subtitle="Analysed attempts stored on this device."
          action={
            outstanding > 0 ? (
              <Link to="/practice/review">
                <Button variant="secondary" size="sm">
                  <Icon name="note" size={14} /> Review {outstanding} rule
                  {outstanding === 1 ? '' : 's'}
                </Button>
              </Link>
            ) : undefined
          }
        />

        {loadingAttempts ? (
          <SkeletonList rows={2} label="Loading your recitation record" />
        ) : records.length === 0 ? (
          <EmptyState
            icon={<Icon name="mic" size={28} />}
            title="No analysed recitations yet"
            body="Record one target and this section fills with your real scores — no estimates in the meantime."
            action={
              <Link to="/practice/session">
                <Button variant="primary">
                  <Icon name="mic" size={16} /> Start a practice session
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric
                label="Attempts analysed"
                value={String(records.length)}
                note="Last 40 kept on this device"
              />
              <Metric
                label="Average score"
                value={avg === null ? '—' : String(avg)}
                note={`Across all ${records.length} attempt${records.length === 1 ? '' : 's'}`}
              />
              <Metric
                label="At or above passing"
                value={`${passing}/${records.length}`}
                note={`Passing is ${PASS_THRESHOLD}`}
              />
            </div>

            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {records.slice(0, 6).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold tabular-nums ${
                      r.score >= 85
                        ? 'bg-success-soft text-success'
                        : r.score >= PASS_THRESHOLD
                          ? 'bg-warning-soft text-warning'
                          : 'bg-error-soft text-error'
                    }`}
                  >
                    {r.score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{r.targetLabel}</p>
                    <p className="text-xs text-ink-faint">
                      {relativeTime(r.at)}
                      {r.priorityRuleName ? ` · focus: ${r.priorityRuleName}` : ' · nothing flagged'}
                    </p>
                  </div>
                  <Link to={r.retryTo} className="shrink-0">
                    <Button variant="outline" size="sm">
                      <Icon name="restart" size={14} /> Retry
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* --- Account data, clearly separated from device data. --- */}
      <section>
        <SectionHeader
          title="Account record"
          subtitle="Synced across your devices."
          action={
            serverState === 'ready' || serverState === 'error' ? (
              <Button variant="ghost" size="sm" onClick={() => void loadServer()}>
                <Icon name="restart" size={14} /> Refresh
              </Button>
            ) : undefined
          }
        />

        {!user ? (
          <InlineNotice
            tone="info"
            title="Not signed in"
            action={
              <Button variant="secondary" size="sm" onClick={() => openAuthModal('login')}>
                Sign in
              </Button>
            }
          >
            Your activity is being kept on this device. Sign in and future attempts are saved to your
            account as well, so this section can show a synced history.
          </InlineNotice>
        ) : serverState === 'idle' ? (
          <InlineNotice tone="warning" title="Demo session — nothing is being saved to a server">
            You are signed in with a demo account that runs entirely in the browser. Everything above
            is real, measured activity from this device; there is no account history to show.
          </InlineNotice>
        ) : serverState === 'loading' ? (
          <SkeletonList rows={2} label="Loading your account record" />
        ) : serverState === 'error' ? (
          <InlineNotice
            tone="error"
            title="Could not reach your account record"
            action={
              <Button variant="secondary" size="sm" onClick={() => void loadServer()}>
                Try again
              </Button>
            }
          >
            The device figures above are unaffected. Your synced history will appear once the service
            is reachable.
          </InlineNotice>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric
                label="Recitations saved"
                value={String(serverStats?.total_recitations ?? 0)}
                note="On your account"
              />
              <Metric
                label="Minutes practised"
                value={String(Math.round(serverStats?.total_minutes_practiced ?? 0))}
                note="Recorded by the server"
              />
              <Metric
                label="Day streak"
                value={String(serverStats?.streak_days ?? 0)}
                note="Consecutive days with activity"
              />
            </div>

            {recitations && recitations.length > 0 && (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                {recitations.slice(0, 5).map((r) => (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-ink-faint">
                        {new Date(r.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                      <Badge tone={r.accuracy_score >= PASS_THRESHOLD ? 'success' : 'warning'}>
                        {Math.round(r.accuracy_score)} accuracy
                      </Badge>
                    </div>
                    <p className="quran-text quran-sm mt-1 line-clamp-1 text-ink" dir="rtl" lang="ar">
                      {r.target_text}
                    </p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {r.passed_rules_count} rules passed · {r.failed_rules_count} to review
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-ink">Where these numbers come from</h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-ink-faint">
            Course completion is counted from lessons finished on this device. Scores are produced by
            the Tajweed analysis engine at the moment you record. Nothing on this page is estimated,
            and no figure is shown for activity that has not happened.
          </p>
        </div>
        <Link to="/reference/tajweed" className="shrink-0">
          <Button variant="outline" size="sm">
            <Icon name="book" size={14} /> Tajweed reference
          </Button>
        </Link>
      </Card>
    </div>
  );
}

function CourseCard({
  title,
  done,
  total,
  to,
  cta,
}: {
  title: string;
  done: number;
  total: number;
  to: string;
  cta: string;
}) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        <Badge tone={done > 0 ? 'brand' : 'neutral'}>
          {done} of {total}
        </Badge>
      </div>
      <ProgressBar value={percent} className="mt-3" />
      <p className="mt-2 text-xs text-ink-faint">
        {done === 0
          ? 'Not started yet.'
          : `${percent}% of lessons completed (${done} of ${total}).`}
      </p>
      <div className="mt-4">
        <Link to={to}>
          <Button variant="secondary" size="sm">
            {cta} <Icon name="arrowRight" size={14} />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-faint">{note}</p>
    </Card>
  );
}
