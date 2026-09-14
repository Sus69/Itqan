import { useCallback, useEffect, useRef, useState } from 'react';
import { getHealth, type HealthStatus } from '@/lib/api';

export type ServiceState = 'checking' | 'available' | 'unavailable';

/**
 * Shared liveness check for the analysis service.
 *
 * The status chip in the shell and the record button in a session need the same
 * answer, so they read it from here rather than each polling on their own — and
 * a session can force a re-check the moment the learner asks it to.
 */
export function useServiceHealth(intervalMs = 20000) {
  const [state, setState] = useState<ServiceState>('checking');
  const [data, setData] = useState<HealthStatus | null>(null);
  const aliveRef = useRef(true);
  const retryTimerRef = useRef<number | null>(null);

  const check = useCallback(async () => {
    try {
      const health = await getHealth();
      if (!aliveRef.current) return;
      setData(health);
      setState('available');
    } catch {
      if (!aliveRef.current) return;
      setState('unavailable');
      // When unavailable (e.g. backend warming up), retry sooner (3s) instead of waiting full interval
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = window.setTimeout(() => {
        if (aliveRef.current) void check();
      }, 3000);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    void check();
    const timer = window.setInterval(() => void check(), intervalMs);
    return () => {
      aliveRef.current = false;
      window.clearInterval(timer);
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
    };
  }, [check, intervalMs]);

  const recheck = useCallback(() => {
    setState('checking');
    void check();
  }, [check]);

  return { state, data, recheck };
}
