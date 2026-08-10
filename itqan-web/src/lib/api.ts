/**
 * Itqān API client.
 * Talks to the FastAPI backend (itqan-phase1/backend/app/main.py).
 *
 * Backend contracts (see backend code):
 *  - GET  /health
 *        -> { status, matcher_loaded, tajweed_loaded, qari_count }
 *  - POST /api/v1/matcher/recommend  (multipart: file)
 *        -> { status:"success", filename, duration_seconds, matches: VoiceMatch[] }
 *  - POST /api/v1/tajweed/analyze    (multipart: file, text)
 *        -> TajweedResult | TajweedInsufficientSpeech
 */

export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:8000';

/* ----------------------------- Types ----------------------------- */

export interface HealthStatus {
  status: string;
  matcher_loaded: boolean;
  tajweed_loaded: boolean;
  qari_count: number;
}

export interface VoiceMatch {
  qari: string;
  confidence: number; // 0..1
}

export interface VoiceMatchResponse {
  status: string;
  filename: string;
  duration_seconds: number;
  matches: VoiceMatch[];
}

export type RuleStatus =
  | 'passed'
  | 'needs_review'
  | 'uncertain'
  | 'not_applicable'
  | 'failed';

export interface RuleEvaluation {
  rule_id: string;
  rule_name: string;
  arabic_name: string;
  tier: number;
  applicable: boolean;
  status: RuleStatus;
  confidence_score: number; // 0..100
  detected_metric: string;
  expected_metric: string;
  suggestion: string;
  description: string;
}

export interface AlignmentChar {
  char: string;
  expected_char: string;
  detected_char: string;
  start_time: number;
  end_time: number;
  is_match: boolean;
  status: 'correct' | 'mismatch' | 'missing' | 'extra';
  correction_note: string | null;
}

export interface VadMetrics {
  is_valid_speech: boolean;
  mean_rms: number;
  peak_amplitude?: number;
  speech_frame_ratio: number;
  reason: string;
}

export interface TajweedResult {
  status: 'success';
  message: string;
  audio_duration_seconds: number;
  phrase_verification: {
    similarity_percentage: number;
    character_accuracy_percentage: number;
    expected_text: string;
    asr_transcription: string;
  };
  alignment_confidence: number;
  alignment: AlignmentChar[];
  evaluations: RuleEvaluation[];
  filename?: string;
}

export interface TajweedInsufficientSpeech {
  status: 'insufficient_speech';
  message: string;
  details: string;
  audio_duration_seconds: number;
  vad_metrics: VadMetrics;
  evaluations: [];
}

export type TajweedResponse = TajweedResult | TajweedInsufficientSpeech;

export function isInsufficientSpeech(r: TajweedResponse): r is TajweedInsufficientSpeech {
  return r.status === 'insufficient_speech';
}

/* ----------------------------- Errors ----------------------------- */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseError(res: Response): Promise<never> {
  let detail = `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
  } catch {
    /* non-JSON error body */
  }
  throw new ApiError(detail, res.status);
}

/* ----------------------------- Endpoints ----------------------------- */

export async function getHealth(signal?: AbortSignal): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`, { signal });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function matchVoice(file: Blob, filename = 'recording.webm'): Promise<VoiceMatchResponse> {
  const form = new FormData();
  form.append('file', file, filename);
  const res = await fetch(`${API_BASE}/api/v1/matcher/recommend`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function analyzeTajweed(
  file: Blob,
  text: string,
  filename = 'recording.webm',
): Promise<TajweedResponse> {
  const form = new FormData();
  form.append('file', file, filename);
  form.append('text', text);
  const res = await fetch(`${API_BASE}/api/v1/tajweed/analyze`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

/* ----------------------------- Device ----------------------------- */

export function getSupportedMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm';
}

export function extForMime(mime: string): string {
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a';
  return 'webm';
}
