/**
 * Itqān API client.
 * Talks to the FastAPI backend (itqan-web/backend/app/main.py).
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

/* ----------------------------- Auth & User Types ----------------------------- */

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  reference_qari_name: string;
  target_daily_minutes: number;
  streak_days: number;
  total_xp: number;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  reference_qari_name: string;
  streak_days: number;
  total_xp: number;
}

export interface DailyActivityItem {
  activity_date: string;
  minutes_practiced: number;
  ayahs_recited: number;
  xp_earned: number;
}

export interface LessonProgressItem {
  id: string;
  course_id: string;
  lesson_id: string;
  status: 'completed' | 'in_progress' | 'not_started';
  score: number;
  attempts: number;
  mastery_level: 'novice' | 'proficient' | 'mastered';
  last_practiced_at: string;
}

export interface UserStatsResponse {
  streak_days: number;
  total_xp: number;
  total_recitations: number;
  total_minutes_practiced: number;
  tajweed_mastery_percentage: number;
  qaida_mastery_percentage: number;
  recent_activity: DailyActivityItem[];
  progress_items: LessonProgressItem[];
}

export interface RecitationHistoryItem {
  id: string;
  target_text: string;
  transcription: string;
  accuracy_score: number;
  audio_duration_seconds: number;
  passed_rules_count: number;
  failed_rules_count: number;
  similarity_percentage: number;
  character_accuracy: number;
  created_at: string;
}

export interface QariProfile {
  id: string;
  name: string;
  arabic_name: string;
  country: string;
  style: string;
  riwayah: string;
  biography: string;
  has_embedding: boolean;
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
  token?: string | null,
): Promise<TajweedResponse> {
  const form = new FormData();
  form.append('file', file, filename);
  form.append('text', text);
  
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/v1/tajweed/analyze`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

/* ----------------------------- Auth APIs ----------------------------- */

export async function registerUser(payload: {
  email: string;
  username: string;
  full_name: string;
  password: string;
  reference_qari_name?: string;
}): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function loginUser(payload: {
  username_or_email: string;
  password: string;
}): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function getAuthMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function updateAuthMe(
  token: string,
  payload: { full_name?: string; reference_qari_name?: string; target_daily_minutes?: number }
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

/* ----------------------------- User Progress APIs ----------------------------- */

export async function getUserProgressOverview(token: string): Promise<UserStatsResponse> {
  const res = await fetch(`${API_BASE}/api/v1/users/me/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function saveUserProgress(
  token: string,
  payload: {
    course_id: string;
    lesson_id: string;
    status: 'completed' | 'in_progress';
    score: number;
    minutes_spent?: number;
    ayahs_recited?: number;
  }
): Promise<LessonProgressItem> {
  const res = await fetch(`${API_BASE}/api/v1/users/me/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function getUserRecitations(token: string, limit = 20): Promise<{ total: number; recitations: RecitationHistoryItem[] }> {
  const res = await fetch(`${API_BASE}/api/v1/users/me/recitations?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

/* ----------------------------- Qaris Directory APIs ----------------------------- */

export async function getQarisList(query?: string, limit = 250): Promise<{ total: number; qaris: QariProfile[] }> {
  const url = query
    ? `${API_BASE}/api/v1/qaris?query=${encodeURIComponent(query)}&limit=${limit}`
    : `${API_BASE}/api/v1/qaris?limit=${limit}`;
  const res = await fetch(url);
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
