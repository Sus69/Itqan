/**
 * Itqān (إتقان) - Speech & Pronunciation Helper for Qaida Tiles
 *
 * This is a *pronunciation guide* built on the browser's own speech engine —
 * useful for checking letter order and pacing. It is deliberately never
 * presented to the learner as reference Qari recitation, because it is not.
 */

export type SpeechSupport = 'ready' | 'no-arabic-voice' | 'unsupported';

function arabicVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic'));
}

/**
 * Whether a usable Arabic voice exists right now. Voice lists load
 * asynchronously in some browsers — pair this with `onVoicesChanged`.
 */
export function speechSupport(): SpeechSupport {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return 'unsupported';
  return arabicVoice() ? 'ready' : 'no-arabic-voice';
}

/** Subscribe to late-arriving voice lists. Returns an unsubscribe function. */
export function onVoicesChanged(listener: () => void): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => undefined;
  window.speechSynthesis.addEventListener('voiceschanged', listener);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', listener);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}

export function speakArabic(text: string, rate: number = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = Math.max(0.5, Math.min(1.5, rate));
    utterance.pitch = 1.0;

    // Pick Arabic voice if available
    const voice = arabicVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}
