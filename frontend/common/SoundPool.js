export default class SoundPool {
  constructor(ctx, buffer, options = {}) {
    this.ctx = ctx;
    this.buffer = buffer;

    this.maxSounds = options.maxSounds || 8;
    this.volume = options.volume ?? 1;

    this.activeSounds = new Set();

    this.gain = ctx.createGain();
    this.gain.gain.value = this.volume;
    this.gain.connect(ctx.destination);
  }

  play({ volume = 1, playbackRate = 1 } = {}) {
    if (this.activeSounds.size >= this.maxSounds) {
      // stop oldest sound
      const first = this.activeSounds.values().next().value;
      first.stop();
      this.activeSounds.delete(first);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.playbackRate.value = playbackRate;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = volume;

    src.connect(gainNode);
    gainNode.connect(this.gain);

    src.start();

    this.activeSounds.add(src);

    src.onended = () => {
      this.activeSounds.delete(src);
    };
  }

  setVolume(v) {
    this.gain.gain.value = v;
  }

  stopAll() {
    this.activeSounds.forEach((src) => src.stop());
    this.activeSounds.clear();
  }
}
