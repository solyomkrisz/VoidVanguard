import SoundPool from "/common/SoundPool.js";
import Sound from "/common/Sound.js";

export default class AudioManager {
  constructor() {
    this.ctx = new AudioContext();
    this.buffers = new Map();
    this.loading = new Map();
    this.sounds = new Map();
  }

  getSound(name) {
    return this.sounds.get(name);
  }

  async queueSound(name, url, options = {}) {
    if (this.sounds.has(name)) {
      return this.sounds.get(name);
    }

    if (this.loading.has(name)) {
      return this.loading.get(name);
    }

    const promise = this.load(name, url)
      .then(() => {
        const soundObject = this.createSound(name, options);

        this.sounds.set(name, soundObject);
        return soundObject;
      })
      .finally(() => {
        this.loading.delete(name);
      });

    this.loading.set(name, promise);
    return promise;
  }

  async load(name, url) {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(arr);

    if (this.buffers.has(name)) {
      throw new Error("A sound buffer called " + name + " is already loaded");
    }

    this.buffers.set(name, buffer);
  }

  createSound(name, options = {}) {
    return new Sound(this.ctx, this.buffers.get(name), options);
  }

  createPool(name, options) {
    return new SoundPool(this.ctx, this.buffers.get(name), options);
  }

  async unlock() {
    if (this.ctx.state !== "running") {
      await this.ctx.resume();
    }
  }

  stopAll() {
    for (const sound of this.sounds.values()) {
      sound.stop();
    }
  }

  whenAllLoaded() {
    return Promise.all(this.loading.values());
  }
}
