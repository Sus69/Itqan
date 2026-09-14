import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupportedMimeType, extForMime } from '@/lib/api';

export type RecordStatus = 'idle' | 'ready' | 'recording' | 'recorded' | 'error';

/**
 * Whether the browser has granted microphone access. `unknown` means we have
 * not asked yet, which is what lets the UI explain the request before making
 * it rather than firing a bare browser prompt.
 */
export type MicPermission = 'unknown' | 'granted' | 'denied' | 'unavailable';

export interface RecordingResult {
  blob: Blob;
  fileName: string;
  mimeType: string;
  objectUrl: string;
  durationSeconds: number;
}

const BARS = 52;

export interface UseRecorder {
  status: RecordStatus;
  error: string | null;
  isSupported: boolean;
  permission: MicPermission;
  /** request mic permission + prime stream */
  init: () => Promise<boolean>;
  start: () => void;
  stop: () => void;
  discard: () => void;
  /** stop the capture stream so the browser mic indicator turns off */
  release: () => void;
  /** live mic level 0..1 */
  level: number;
  /** rolling waveform values 0..1 for display */
  bars: number[];
  /** elapsed seconds while recording */
  seconds: number;
  /** peak level seen during the last take — used to detect a silent room */
  peak: number;
  result: RecordingResult | null;
}

export function useRecorder(): UseRecorder {
  const isSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const [status, setStatus] = useState<RecordStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<MicPermission>(
    isSupported ? 'unknown' : 'unavailable',
  );
  const [level, setLevel] = useState(0);
  const [bars, setBars] = useState<number[]>(() => Array(BARS).fill(0.06));
  const [seconds, setSeconds] = useState(0);
  const [peak, setPeak] = useState(0);
  const [result, setResult] = useState<RecordingResult | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const peakRef = useRef<number>(0);
  const mimeRef = useRef<string>(getSupportedMimeType());
  const resultRef = useRef<RecordingResult | null>(null);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  // Reflect an already-granted (or already-blocked) permission so the UI can
  // skip the explainer on return visits. Not supported everywhere; silent when
  // the query is unavailable.
  useEffect(() => {
    if (!isSupported || !navigator.permissions?.query) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((entry) => {
        if (cancelled) return;
        if (entry.state === 'granted') setPermission('granted');
        else if (entry.state === 'denied') setPermission('denied');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isSupported]);

  const stopMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    setLevel(0);
  }, []);

  const startMeter = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const lvl = Math.min(1, rms * 3.2); // amplify for visibility
      if (lvl > peakRef.current) {
        peakRef.current = lvl;
        setPeak(lvl);
      }
      setLevel(lvl);
      setBars((prev) => {
        const next = prev.slice(1);
        next.push(Math.max(0.06, lvl));
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const init = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Audio recording is not supported in this browser.');
      setStatus('error');
      return false;
    }
    if (streamRef.current) {
      setStatus((s) => (s === 'recorded' ? s : 'ready'));
      return true;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
      streamRef.current = stream;

      const Ctx: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setError(null);
      setPermission('granted');
      setStatus((s) => (s === 'recorded' ? s : 'ready'));
      return true;
    } catch (e) {
      const denied =
        e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      const msg = denied
        ? 'Microphone permission was denied. Please allow mic access and try again.'
        : e instanceof DOMException && e.name === 'NotFoundError'
          ? 'No microphone was found on this device.'
          : 'Could not access the microphone.';
      setError(msg);
      setPermission(denied ? 'denied' : 'unavailable');
      setStatus('error');
      return false;
    }
  }, [isSupported]);

  const start = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mime = mimeRef.current;
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime });
    } catch {
      recorder = new MediaRecorder(stream);
      mimeRef.current = recorder.mimeType || 'audio/webm';
    }
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      stopMeter();
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const durationSeconds = (Date.now() - startedAtRef.current) / 1000;
      const type = recorder.mimeType || mimeRef.current;
      const blob = new Blob(chunksRef.current, { type });
      const ext = extForMime(type);
      const fileName = `itqan-recitation.${ext}`;
      const objectUrl = URL.createObjectURL(blob);
      setResult({ blob, fileName, mimeType: type, objectUrl, durationSeconds });
      setSeconds(durationSeconds);
      setStatus('recorded');
    };
    recorder.start(120);
    startedAtRef.current = Date.now();
    setSeconds(0);
    peakRef.current = 0;
    setPeak(0);
    timerRef.current = window.setInterval(
      () => setSeconds((Date.now() - startedAtRef.current) / 1000),
      100,
    );
    setBars(Array(BARS).fill(0.06));
    setStatus('recording');
    startMeter();
  }, [startMeter, stopMeter]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  const discard = useCallback(() => {
    if (result) URL.revokeObjectURL(result.objectUrl);
    setResult(null);
    setBars(Array(BARS).fill(0.06));
    setLevel(0);
    setSeconds(0);
    peakRef.current = 0;
    setPeak(0);
    setStatus(streamRef.current ? 'ready' : 'idle');
  }, [result]);

  /**
   * Hands the microphone back to the browser. Called when a session surface
   * unmounts or the learner leaves the record step, so the recording indicator
   * does not stay lit while they read theory.
   */
  const release = useCallback(() => {
    stopMeter();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        /* noop */
      }
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    setStatus((s) => (s === 'recorded' || s === 'error' ? s : 'idle'));
  }, [stopMeter]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopMeter();
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop(); } catch { /* noop */ }
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => undefined);
      if (resultRef.current) URL.revokeObjectURL(resultRef.current.objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    error,
    isSupported,
    permission,
    init,
    start,
    stop,
    discard,
    release,
    level,
    bars,
    seconds,
    peak,
    result,
  };
}

export { BARS };
