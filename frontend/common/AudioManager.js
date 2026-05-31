/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/common/AudioManager.js
 * Szerep: Hangbuffer betolto es hangobjektum-kezelo kozos AudioContexttel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import SoundPool from "/common/SoundPool.js";
import Sound from "/common/Sound.js";

export default class AudioManager {
  // Letrehozza a kozos audio contextet, a buffer cache-t es a lejatszott hangok nyilvantartasat.
  constructor() {
    this.ctx = new AudioContext();
    this.buffers = new Map();
    this.loading = new Map();
    this.sounds = new Map();

    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
  }

  // A teljes audio rendszer fo hangeroszabalyzojat allitja.
  setVolume(volume) {
    this.gainNode.gain.value = volume;
  }

  // Visszaad egy mar letrehozott hangobjektumot nev alapjan.
  getSound(name) {
    return this.sounds.get(name);
  }

  // Utemezi a hang betolteset, majd a tipus alapjan single soundot vagy poolt hoz letre.
  async queueAudio(name, url, options = {}) {
    if (this.sounds.has(name)) {
      return this.sounds.get(name);
    }

    if (this.loading.has(name)) {
      return this.loading.get(name);
    }

    const promise = this.load(name, url)
      .then(() => {
        const entry =
          options.type === "pool"
            ? this.createPool(name, { gainNode: this.gainNode, ...options })
            : this.createSound(name, { gainNode: this.gainNode, ...options });

        const audioObject = {
          type: options.type ?? "sound",
          instance: entry,
        };

        this.sounds.set(name, audioObject);
        return audioObject;
      })
      .finally(() => {
        this.loading.delete(name);
      });

    this.loading.set(name, promise);
    return promise;
  }

  // Letolti es dekodolja a hangfajlt, majd bufferkent cache-eli.
  async load(name, url) {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(arr);

    if (this.buffers.has(name)) {
      throw new Error("A sound buffer called " + name + " is already loaded");
    }

    this.buffers.set(name, buffer);
  }

  // Egyetlen ujrahasznalhato Sound objektumot keszit a bufferbol.
  createSound(name, options = {}) {
    return new Sound(this.ctx, this.buffers.get(name), options);
  }

  // Olyan poolt keszit, amely tobb rovid hangot tud egyszerre lejatszani.
  createPool(name, options = {}) {
    return new SoundPool(this.ctx, this.buffers.get(name), options);
  }

  // Feloldja a bongeszo autoplay zarat az AudioContext ujrainditasaval.
  async unlock() {
    if (this.ctx.state !== "running") {
      await this.ctx.resume();
    }
  }

  // Minden aktiv hangot azonnal leallit.
  stopAll() {
    for (const sound of this.sounds.values()) {
      if (sound.type === "pool") {
        sound.instance.stopAll();
      } else {
        sound.instance.stop();
      }
    }
  }

  // doesnt do anything to paused musics
  // Csak az aktualisan szolo hangokat allitja le, a paused allapotot nem bántja.
  softStopAll() {
    for (const sound of this.sounds.values()) {
      if (sound.type === "pool") {
        sound.instance.stopAll();
      } else {
        if (!sound.instance.paused) {
          sound.instance.stop();
        }
      }
    }
  }

  // Promise-t ad, ami akkor oldodik fel, ha az osszes jelenlegi betoltes befejezodott.
  whenAllLoaded() {
    return Promise.all(this.loading.values());
  }
}
