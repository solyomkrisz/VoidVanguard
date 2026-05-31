/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/common/SoundPool.js
 * Szerep: Rovid effekthangok parhuzamos lejatszasara szolgalo objektumpool.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export default class SoundPool {
  // Beallitja a pool meretet es az aktivan szolo forrasok tarolojat.
  constructor(ctx, buffer, options = {}) {
    this.ctx = ctx;
    this.buffer = buffer;

    this.maxSounds = options.maxSounds || 8;
    this.volume = options.volume ?? 1;

    this.activeSounds = new Set();

    if (options.gainNode) {
      this.gainNode = options.gainNode;
    } else {
      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(ctx.destination);
    }
  }

  // Elindit egy uj hangot, es ha betelt a pool, a legrgebbit kiloki.
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
    gainNode.connect(this.gainNode);

    src.start();

    this.activeSounds.add(src);

    src.onended = () => {
      this.activeSounds.delete(src);
    };
  }

  // A teljes pool kimeneti hangerejet allitja.
  setVolume(v) {
    this.gainNode.gain.value = v;
  }

  // Minden aktiv forrast leallit es kiuritja a poolt.
  stopAll() {
    this.activeSounds.forEach((src) => src.stop());
    this.activeSounds.clear();
  }
}
