// Queues translated_audio clips and plays them strictly one at a time.
// Without this, two phrases arriving close together (normal for full-duplex
// interpretation - see docs/LIVE_INTERPRETED_CALLS.md) would overlap and
// become unintelligible instead of just queuing up slightly behind.
export class TranslatedAudioQueue {
  private queue: string[] = [];
  private playing = false;
  private currentAudio: HTMLAudioElement | null = null;

  enqueue(base64Mp3: string) {
    this.queue.push(base64Mp3);
    if (!this.playing) this.playNext();
  }

  private playNext() {
    const next = this.queue.shift();
    if (!next) {
      this.playing = false;
      return;
    }
    this.playing = true;
    const audio = new Audio(`data:audio/mpeg;base64,${next}`);
    this.currentAudio = audio;
    audio.onended = () => this.playNext();
    audio.onerror = () => this.playNext();
    audio.play().catch(() => this.playNext());
  }

  clear() {
    this.queue = [];
    this.playing = false;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }
}
