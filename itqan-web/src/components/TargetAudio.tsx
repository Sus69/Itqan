import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/Icon';
import { InlineNotice } from '@/components/ui';
import { onVoicesChanged, speakArabic, speechSupport, stopSpeaking } from '@/lib/qaidaAudio';

type Rate = 0.75 | 1;

/**
 * CMP-AUD-001 — the single audio playback affordance.
 *
 * Every surface that offers "hear it first" uses this, so Play, Pause, Slow and
 * Repeat always look and behave the same. It is explicitly labelled as a
 * synthesised pronunciation guide: the app has no licensed Qari audio, and
 * claiming otherwise would misrepresent what the learner is hearing.
 *
 * Playback never starts on its own — recitation is not background noise.
 */
export function TargetAudio({
  text,
  label = 'Hear the target',
  className,
  compact = false,
}: {
  text: string;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const [support, setSupport] = useState(() => speechSupport());
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<Rate>(1);
  const [loop, setLoop] = useState(false);
  const loopRef = useRef(loop);
  const runIdRef = useRef(0);

  loopRef.current = loop;

  useEffect(() => onVoicesChanged(() => setSupport(speechSupport())), []);

  // Never leave audio running behind a navigation.
  useEffect(
    () => () => {
      runIdRef.current += 1;
      stopSpeaking();
    },
    [],
  );

  const stop = useCallback(() => {
    runIdRef.current += 1;
    stopSpeaking();
    setPlaying(false);
  }, []);

  const play = useCallback(
    async (atRate: Rate) => {
      const runId = ++runIdRef.current;
      setPlaying(true);
      do {
        await speakArabic(text, atRate);
        if (runIdRef.current !== runId) return; // superseded by stop/replay
      } while (loopRef.current);
      setPlaying(false);
    },
    [text],
  );

  const chooseRate = (next: Rate) => {
    setRate(next);
    if (playing) void play(next);
  };

  if (support === 'unsupported' || support === 'no-arabic-voice') {
    return (
      <InlineNotice tone="neutral" title="Audio guide unavailable on this device" className={className}>
        {support === 'unsupported'
          ? 'This browser has no speech engine, so the pronunciation guide cannot play. The written target and your recording feedback still work normally.'
          : 'No Arabic voice is installed on this device. Add an Arabic language pack in your system settings to enable the pronunciation guide.'}
      </InlineNotice>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => (playing ? stop() : void play(rate))}
          aria-label={playing ? 'Stop the pronunciation guide' : label}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors',
            playing
              ? 'bg-brand-800 text-white hover:bg-brand-900'
              : 'bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-100',
          )}
        >
          <Icon name={playing ? 'pause' : 'play'} size={16} aria-hidden="true" />
          {playing ? 'Stop' : label}
        </button>

        <div
          role="group"
          aria-label="Playback speed"
          className="inline-flex h-10 items-center rounded-xl border border-border bg-surface p-1"
        >
          {([1, 0.75] as Rate[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => chooseRate(r)}
              aria-pressed={rate === r}
              className={cn(
                'h-8 rounded-lg px-3 text-xs font-bold transition-colors',
                rate === r ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-sand-100',
              )}
            >
              {r === 1 ? 'Normal' : 'Slow 0.75×'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setLoop((v) => !v)}
          aria-pressed={loop}
          className={cn(
            'inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors',
            loop
              ? 'border-brand-300 bg-brand-50 text-brand-800'
              : 'border-border bg-surface text-ink-soft hover:bg-sand-100',
          )}
        >
          <Icon name="restart" size={14} aria-hidden="true" />
          Repeat {loop ? 'on' : 'off'}
        </button>
      </div>

      {!compact && (
        <p className="text-xs leading-relaxed text-ink-faint">
          A synthesised pronunciation guide from your device — helpful for word order and pacing, not
          a Qari recitation.
        </p>
      )}
    </div>
  );
}
