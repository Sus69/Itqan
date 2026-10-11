/**
 * Itqān (إتقان) - Speech & Pronunciation Helper for Qaida Tiles & Makhaarij
 *
 * Uses the backend high-fidelity Arabic neural TTS engine (/api/v1/audio/tts)
 * with automatic fallback to Web Speech API when offline.
 */

export type SpeechSupport = 'ready' | 'no-arabic-voice' | 'unsupported';

let currentAudio: HTMLAudioElement | null = null;

function arabicVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
  return window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic'));
}

/**
 * Whether a usable Arabic voice exists right now.
 * Ready by default because the backend neural TTS service provides authentic Arabic audio.
 */
export function speechSupport(): SpeechSupport {
  return 'ready';
}

/** Subscribe to late-arriving voice lists. Returns an unsubscribe function. */
export function onVoicesChanged(listener: () => void): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => undefined;
  window.speechSynthesis.addEventListener('voiceschanged', listener);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', listener);
}

export function stopSpeaking(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // Ignore audio abort errors
    }
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function speakViaSpeechSynthesis(text: string, rate: number = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = Math.max(0.5, Math.min(1.5, rate));
    utterance.pitch = 1.0;

    const voice = arabicVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export async function speakArabic(text: string, rate: number = 0.85): Promise<void> {
  stopSpeaking();
  if (!text || !text.trim()) return;

  // 1. Primary: Use Itqān Backend Neural TTS Engine
  try {
    const ratePercent =
      rate === 1
        ? '+0%'
        : rate < 1
          ? `-${Math.round((1 - rate) * 40)}%`
          : `+${Math.round((rate - 1) * 40)}%`;
    const url = `/api/v1/audio/tts?text=${encodeURIComponent(text.trim())}&rate=${encodeURIComponent(ratePercent)}`;

    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(url);
      currentAudio = audio;

      audio.onended = () => {
        if (currentAudio === audio) currentAudio = null;
        resolve();
      };

      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        reject(new Error('Backend TTS stream failed'));
      };

      audio.play().catch(reject);
    });
    return;
  } catch {
    // 2. Fallback: Browser Web Speech API if backend unreachable
    return speakViaSpeechSynthesis(text, rate);
  }
}
