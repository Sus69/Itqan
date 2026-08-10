import { useEffect } from 'react';
import { useRecorder } from '@/hooks/useRecorder';
import { Button } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { formatSeconds } from '@/lib/format';
import { cn } from '@/lib/cn';

interface RecorderPanelProps {
  /** called once a finished recording is available */
  onRecorded: (blob: Blob, fileName: string) => void | Promise<void>;
  /** visible busy state while uploading/analyzing */
  busy?: boolean;
  busyLabel?: string;
  hint?: string;
}

/**
 * CMP-AUD-003 Recording Panel
 * Captures learner audio with live waveform + mic level, then hands off
 * the finished Blob to the parent for analysis.
 */
export function RecorderPanel({ onRecorded, busy = false, busyLabel = 'Analyzing…', hint }: RecorderPanelProps) {
  const rec = useRecorder();
  const isRecording = rec.status === 'recording';
  const isRecorded = rec.status === 'recorded';

  // auto-fire analysis when a recording completes
  useEffect(() => {
    if (isRecorded && rec.result) {
      void onRecorded(rec.result.blob, rec.result.fileName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecorded]);

  const handlePrimary = async () => {
    if (isRecording) {
      rec.stop();
      return;
    }
    if (rec.status === 'idle' || rec.status === 'error') {
      const ok = await rec.init();
      if (ok) rec.start();
      return;
    }
    rec.start();
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-2 p-5 shadow-[var(--shadow-soft)]">
      {/* Live waveform */}
      <div
        className="flex h-20 items-end justify-between gap-[3px] rounded-xl bg-brand-950/5 px-3 py-3"
        aria-hidden="true"
      >
        {rec.bars.map((v, i) => (
          <span
            key={i}
            className={cn(
              'w-full origin-bottom rounded-full transition-colors',
              isRecording ? 'bg-brand-500' : isRecorded ? 'bg-success/70' : 'bg-sand-300',
            )}
            style={{
              height: `${Math.max(6, Math.round(v * 100))}%`,
              transform: 'scaleY(1)',
              transition: 'height 80ms linear',
            }}
          />
        ))}
      </div>

      {/* Status row */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Mic level meter */}
          <div className="flex h-9 w-24 items-center gap-[3px]" aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'w-full rounded-sm',
                  rec.level * 10 > i
                    ? i < 7 ? 'bg-brand-500' : 'bg-gold-500'
                    : 'bg-sand-200',
                )}
                style={{ height: `${30 + i * 6}%` }}
              />
            ))}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">
              {busy
                ? busyLabel
                : isRecording
                  ? 'Recording…'
                  : isRecorded
                    ? 'Recording captured'
                    : rec.status === 'ready'
                      ? 'Microphone ready'
                      : 'Tap to begin'}
            </p>
            <p className="text-xs tabular-nums text-ink-faint">
              {isRecording || isRecorded ? formatSeconds(rec.seconds) : hint ?? 'Recite clearly at a natural pace'}
            </p>
          </div>
        </div>

        {isRecorded && !busy && (
          <audio controls src={rec.result?.objectUrl} className="h-10 w-48 sm:w-64" dir="ltr" />
        )}
      </div>

      {rec.error && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-error-soft px-3 py-2 text-xs font-medium text-error">
          <Icon name="alert" size={14} className="mt-0.5 shrink-0" /> {rec.error}
        </p>
      )}

      {/* Controls */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <Button
          onClick={handlePrimary}
          variant={isRecording ? 'danger' : 'primary'}
          size="lg"
          disabled={busy}
          className={cn('min-w-44', isRecording && 'anim-rec')}
        >
          {busy ? (
            <span className="anim-spin inline-block size-4 rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Icon name={isRecording ? 'stop' : 'mic'} size={18} filled={isRecording} />
          )}
          {busy ? busyLabel : isRecording ? 'Stop & Analyze' : 'Start Recording'}
        </Button>

        {isRecorded && !busy && (
          <Button variant="ghost" size="lg" onClick={rec.discard}>
            <Icon name="restart" size={18} />
            Retry
          </Button>
        )}
      </div>

      {!rec.isSupported && (
        <p className="mt-3 text-center text-xs text-error">
          Recording requires a modern browser with microphone support (Chrome, Edge, Firefox).
        </p>
      )}
    </div>
  );
}
