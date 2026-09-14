import { useServiceHealth } from '@/hooks/useServiceHealth';
import { cn } from '@/lib/cn';

/**
 * Shell status chip. It names the consequence rather than just the state — an
 * offline engine means feedback is paused, and the learner should be told that
 * here rather than discovering it when a recording fails to upload.
 */
export function BackendStatus({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { state, data } = useServiceHealth();

  const dot =
    state === 'available' ? 'bg-success' : state === 'unavailable' ? 'bg-error' : 'bg-warning';
  const label =
    state === 'checking'
      ? 'Checking feedback engine'
      : state === 'available'
        ? 'Feedback engine ready'
        : 'Feedback engine unreachable';

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2',
          className,
        )}
      >
        <span className={cn('size-2 rounded-full', dot, state === 'checking' && 'anim-pulse')} />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-ink">{label}</p>
          <p className="text-[10px] text-ink-faint">
            {state === 'available'
              ? `${data?.qari_count ?? 0} reference Qaris loaded`
              : state === 'unavailable'
                ? 'Recording feedback is paused'
                : 'One moment'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5',
        className,
      )}
      aria-live="polite"
    >
      <span className={cn('size-2 rounded-full', dot, state === 'checking' && 'anim-pulse')} />
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
    </div>
  );
}
