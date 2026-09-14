import { useEffect, useRef, useState } from 'react';
import { useRecorder } from '@/hooks/useRecorder';
import { Button, InlineNotice, VisuallyHidden } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { formatSeconds } from '@/lib/format';
import { cn } from '@/lib/cn';

/** Below this the take is almost certainly a mis-tap rather than a recitation. */
const MIN_SECONDS = 1.5;
/** Peak level below this over a whole take means the mic heard essentially nothing. */
const QUIET_PEAK = 0.08;

interface RecordingSessionProps {
  /** Hands the finished take to the parent for analysis. */
  onSubmit: (blob: Blob, fileName: string) => void | Promise<void>;
  /** Parent is analysing — the session shows a named processing state. */
  busy?: boolean;
  /** What is happening, in the learner's language. */
  busyLabel?: string;
  /** One line telling the learner what to recite and how. */
  guidance?: string;
  /** False when the analysis service is unreachable; recording is held back. */
  serviceAvailable?: boolean;
  onRetryService?: () => void;
  /** Resets the session back to ready — bump this when the target changes. */
  resetKey?: string | number;
}

/**
 * CMP-AUD-003 — the recording session.
 *
 * One shape for every record step in the app: explain → ready → recording →
 * review → analysing. The review step is deliberate: the learner hears their own
 * take and decides whether to send it, instead of the app submitting the moment
 * they stop. Degraded states (no support, offline, service down, permission
 * denied, silent take, too short) each have their own explained state rather
 * than a generic failure.
 */
export function RecordingSession({
  onSubmit,
  busy = false,
  busyLabel = 'Analysing your recitation',
  guidance = 'Recite at your natural pace. You will hear your take before anything is analysed.',
  serviceAvailable = true,
  onRetryService,
  resetKey,
}: RecordingSessionProps) {
  const rec = useRecorder();
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [explained, setExplained] = useState(false);
  const discardRef = useRef(rec.discard);
  discardRef.current = rec.discard;

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // A new target means the previous take no longer applies.
  useEffect(() => {
    if (resetKey === undefined) return;
    discardRef.current();
  }, [resetKey]);

  const isRecording = rec.status === 'recording';
  const isReviewing = rec.status === 'recorded' && !busy;
  const tooShort = (rec.result?.durationSeconds ?? 0) < MIN_SECONDS;
  const tooQuiet = rec.peak < QUIET_PEAK;
  const blocked = !online || !serviceAvailable;

  const statusLine = busy
    ? busyLabel
    : isRecording
      ? `Recording — ${formatSeconds(rec.seconds)}`
      : isReviewing
        ? `Your take — ${formatSeconds(rec.result?.durationSeconds ?? 0)}. Listen, then send it or record again.`
        : rec.status === 'ready'
          ? 'Microphone ready'
          : 'Ready when you are';

  const beginRecording = async () => {
    if (rec.status === 'idle' || rec.status === 'error') {
      const ok = await rec.init();
      if (!ok) return;
    }
    rec.start();
  };

  /* ---- Hard stops: nothing to record with ---- */
  if (!rec.isSupported) {
    return (
      <InlineNotice tone="error" title="Recording is not available in this browser">
        Itqān records through the Web Audio API. Chrome, Edge, Firefox or Safari 15+ will work. You
        can still read the target and follow the written guidance here.
      </InlineNotice>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-2 p-5 shadow-[var(--shadow-soft)]">
      {/* Degradation notices come first: they explain why the button below is held back. */}
      {!online && (
        <InlineNotice
          tone="warning"
          title="You are offline"
          live
        >
          Feedback needs a connection to the analysis service. Reconnect and your recording controls
          come straight back — nothing you have already completed is lost.
        </InlineNotice>
      )}

      {online && !serviceAvailable && (
        <InlineNotice
          tone="warning"
          title="The analysis service is not responding"
          live
          action={
            onRetryService && (
              <Button variant="secondary" size="sm" onClick={onRetryService}>
                <Icon name="restart" size={14} /> Check again
              </Button>
            )
          }
        >
          Recording is paused until it is reachable, so you do not lose a take to a failed upload.
        </InlineNotice>
      )}

      {rec.permission === 'denied' && (
        <InlineNotice tone="error" title="Microphone access is blocked">
          Your browser is refusing microphone access for this site. Open the site permissions in the
          address bar, set the microphone to Allow, then choose Record again.
        </InlineNotice>
      )}

      {/* Permission explainer — shown before the browser prompt, not after. */}
      {rec.permission === 'unknown' && !explained ? (
        <div className="space-y-4 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
            <Icon name="mic" size={22} />
          </span>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-ink">Itqān needs your microphone to listen</h3>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-soft">
              Your browser will ask for permission. Nothing is captured until you choose Record, and
              each take is sent for analysis only when you press Get feedback.
            </p>
          </div>
          <Button
            size="lg"
            disabled={blocked}
            onClick={async () => {
              setExplained(true);
              await rec.init();
            }}
          >
            <Icon name="mic" size={17} /> Allow microphone
          </Button>
        </div>
      ) : (
        <>
          {/* Waveform. Decorative on its own — the status line below carries the meaning. */}
          <div
            className="flex h-20 items-end justify-between gap-[3px] rounded-xl bg-brand-950/5 px-3 py-3"
            aria-hidden="true"
          >
            {rec.bars.map((v, i) => (
              <span
                key={i}
                className={cn(
                  'w-full origin-bottom rounded-full',
                  isRecording ? 'bg-brand-500' : rec.status === 'recorded' ? 'bg-success/70' : 'bg-sand-300',
                )}
                style={{ height: `${Math.max(6, Math.round(v * 100))}%`, transition: 'height 80ms linear' }}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-24 items-center gap-[3px]" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-full rounded-sm',
                      rec.level * 10 > i ? (i < 7 ? 'bg-brand-500' : 'bg-gold-500') : 'bg-sand-200',
                    )}
                    style={{ height: `${30 + i * 6}%` }}
                  />
                ))}
              </div>
              <div className="leading-tight">
                <p aria-live="polite" className="text-sm font-semibold text-ink">
                  {statusLine}
                </p>
                <p className="mt-0.5 max-w-md text-xs leading-relaxed text-ink-faint">
                  {isRecording ? 'Press Stop when you finish the target.' : guidance}
                </p>
              </div>
            </div>

            {isReviewing && (
              <div className="flex items-center gap-2">
                <VisuallyHidden>Play back your recording</VisuallyHidden>
                <audio controls src={rec.result?.objectUrl} className="h-10 w-48 sm:w-56" dir="ltr" />
              </div>
            )}
          </div>

          {rec.error && rec.permission !== 'denied' && (
            <InlineNotice tone="error" title="Microphone problem">
              {rec.error}
            </InlineNotice>
          )}

          {isReviewing && (tooShort || tooQuiet) && (
            <InlineNotice
              tone="warning"
              title={tooShort ? 'That take was very short' : 'That take came through very quietly'}
              live
            >
              {tooShort
                ? `Only ${formatSeconds(rec.result?.durationSeconds ?? 0)} was captured, which is usually too little to evaluate. Recording again will give you far more useful feedback.`
                : 'The microphone barely picked anything up. Move closer, check that the right input device is selected, and try once more.'}
            </InlineNotice>
          )}

          {busy && (
            <InlineNotice tone="info" title={busyLabel} live>
              Comparing your recitation against the target, then checking the Tajweed rules that apply
              to it. This usually takes a few seconds.
            </InlineNotice>
          )}

          {/* Controls: exactly one primary action per state. */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {isReviewing ? (
              <>
                <Button
                  size="lg"
                  variant={tooShort || tooQuiet ? 'secondary' : 'primary'}
                  onClick={() => rec.result && void onSubmit(rec.result.blob, rec.result.fileName)}
                  disabled={blocked}
                  className="min-w-44"
                >
                  <Icon name="sparkle" size={17} /> Get feedback
                </Button>
                <Button
                  size="lg"
                  variant={tooShort || tooQuiet ? 'primary' : 'ghost'}
                  onClick={rec.discard}
                >
                  <Icon name="restart" size={17} /> Record again
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                variant={isRecording ? 'danger' : 'primary'}
                onClick={() => (isRecording ? rec.stop() : void beginRecording())}
                loading={busy}
                disabled={busy || blocked || rec.permission === 'denied'}
                className={cn('min-w-44', isRecording && 'anim-rec')}
              >
                {!busy && <Icon name={isRecording ? 'stop' : 'mic'} size={18} filled={isRecording} />}
                {busy ? busyLabel : isRecording ? 'Stop' : 'Record'}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
