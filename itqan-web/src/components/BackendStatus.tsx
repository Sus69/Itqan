import { useEffect, useState } from 'react';
import { getHealth, type HealthStatus } from '@/lib/api';
import { cn } from '@/lib/cn';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthStatus }
  | { kind: 'down' };

export function BackendStatus({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await getHealth();
        if (alive) setState({ kind: 'ok', data });
      } catch {
        if (alive) setState({ kind: 'down' });
      }
    };
    load();
    const t = window.setInterval(load, 20000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  const online = state.kind === 'ok';
  const dot = online ? 'bg-success' : state.kind === 'down' ? 'bg-error' : 'bg-warning';
  const label =
    state.kind === 'loading' ? 'Connecting…' : online ? 'AI Engine Online' : 'AI Engine Offline';

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2', className)}>
        <span className={cn('size-2 rounded-full', dot, state.kind === 'loading' && 'animate-pulse')} />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-ink">{label}</p>
          {state.kind === 'ok' && (
            <p className="text-[10px] text-ink-faint">{state.data.qari_count} Qaris ready</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5', className)}>
      <span className={cn('size-2 rounded-full', dot, state.kind === 'loading' && 'animate-pulse')} />
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      {state.kind === 'ok' && (
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
          {state.data.qari_count} Qaris
        </span>
      )}
    </div>
  );
}
