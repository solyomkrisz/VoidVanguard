import SoundPool from "/common/SoundPool.js";
import Sound from "/common/Sound.js";

export default class AudioManager {
  constructor() {
    this.ctx = new AudioContext();
    this.buffers = new Map();
    this.promises = [];
  }

  queueAudio(name, url) {
    const promise = this.load(name, url);
    this.promises.push(promise);
    return promise;
  }

  async load(name, url) {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(arr);

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
}
