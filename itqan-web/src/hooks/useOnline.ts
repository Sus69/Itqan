import { useEffect, useState } from 'react';

/**
 * Connectivity, as one source of truth.
 *
 * Several surfaces need to hold back an action that requires the analysis
 * service — the recording session, the shell banner — and they must all agree.
 * `navigator.onLine` is only a hint (it reports the network interface, not
 * reachability), so treat it as "definitely offline" rather than "definitely
 * online": the service-health check is what confirms the backend is answering.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}
