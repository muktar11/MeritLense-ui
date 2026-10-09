/**
 * Fallback read-aloud using the browser's own speech engine (Web Speech
 * API) for when the server voice is unavailable - free, no network call to
 * our backend. Most browsers ship Arabic and English voices (Chrome, Edge,
 * Safari, iOS, Android); if none matches the language we report that so
 * the page can say so instead of failing silently.
 */

function voicesReady(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  // Chrome loads voices asynchronously.
  return new Promise((resolve) => {
    const done = () => resolve(synth.getVoices());
    synth.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1500);
  });
}

export function browserSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/** Speaks `text` in `languageCode` (e.g. "ar-SA"). Resolves true if a
 *  matching voice was found and speech started, false otherwise. */
export async function speakWithBrowser(text: string, languageCode: string): Promise<boolean> {
  if (!browserSpeechSupported() || !text) return false;
  const prefix = languageCode.split("-")[0].toLowerCase();
  const voices = await voicesReady();
  const voice =
    voices.find((v) => v.lang.toLowerCase() === languageCode.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (!voice) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopBrowserSpeech() {
  if (browserSpeechSupported()) window.speechSynthesis.cancel();
}
