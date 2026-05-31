/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/common/Sound.js
 * Szerep: Egyetlen hang lejatszasa pause/resume/loop allapottal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export default class Sound {
  // Elokesziti az egy darab hanghoz tartozo allapotot es opcionális gain csatornat.
  constructor(ctx, buffer, options = {}) {
    this.ctx = ctx;
    this.buffer = buffer;

    this.loop = options.loop ?? false;

    if (options.gainNode) {
      this.gainNode = options.gainNode;
    } else {
      this.gainNode = ctx.createGain();
      this.gainNode.connect(ctx.destination);
    }

    this.source = null;
    this.startTime = 0;
    this.offset = 0;
    this.isPlaying = false;
    this.playCount = 0;
    this.offsetByPlay = options.offsetByPlay ?? []; // an array: 0-th item offset for first play, 1st item offset for 1st play etc

    this.paused = false;
    this.stopped = false;
  }

  // Letrehoz egy uj BufferSource-t, es loop eseten gondoskodik az ujrainditasrol is.
  _createSource() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;

    // src.loop = this.loop;

    if (this.loop) {
      src.onended = () => {
        this.isPlaying = false;
        if (!this.paused && !this.stopped) {
          this.offset = 0;
          this.start();
        }
      };
    }

    src.connect(this.gainNode);
    return src;
  }

  // Elinditja a hangot az aktualis offsetrol vagy az adott lejatszashoz tartozo felulirasrol.
  start() {
    if (this.isPlaying) return;

    this.stopped = false;

    this.source = this._createSource();
    this.startTime = this.ctx.currentTime;

    let offset = this.offset;

    const offsetForPlay =
      this.offsetByPlay.length <= this.playCount
        ? this.offsetByPlay[this.offsetByPlay.length - 1]
        : this.offsetByPlay[this.playCount];

    if (offsetForPlay != null && !this.paused) {
      offset = offsetForPlay;
    }

    console.log(offset);

    this.source.start(0, offset);
    this.isPlaying = true;
    this.playCount++;
  }

  // Megallitja a lejatszast, de elmenti, honnan lehessen folytatni.
  pause() {
    if (!this.isPlaying) return;

    const elapsed = this.ctx.currentTime - this.startTime;
    this.offset = (this.offset + elapsed) % this.buffer.duration;

    this.source.stop();
    this.source = null;
    this.isPlaying = false;
    this.paused = true;
  }

  // A pause utan ugyanonnan probalja ujrainditani a hangot.
  resume() {
    this.start();
    this.paused = false;
  }

  // Teljesen leallitja es alaphelyzetbe teszi a hangobjektumot.
  stop() {
    if (this.source) this.source.stop();

    this.source = null;
    this.offset = 0;
    this.isPlaying = false;
    this.stopped = true;
    this.playCount = 0;
  }
}
