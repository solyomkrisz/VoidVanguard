export default class Game {
  constructor() {
    this.running = false;

    this.tickrate = 10;
    this.ticks = 0;
    this.frames = 0;
    this.timestep = 1000 / this.tickrate;
    this.alpha = 0;

    this.now = 0;
    this.last = 0;
    this.dt = 0;
    this.unprocessed = 0;

    this.frameId = 0;

    this.update = this.update.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;

    this.last = window.performance.now();
    this.frameId = window.requestAnimationFrame(this.update);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    window.cancelAnimationFrame(this.frameId);
  }

  update() {
    this.now = window.performance.now();
    this.dt = this.now - this.last;
    this.last = this.now;

    this.unprocessed += this.dt;

    while (this.unprocessed >= this.timestep) {
      this.ticks++;
      this.unprocessed -= this.timestep;
    }

    this.alpha = this.unprocessed / this.timestep;

    this.frames++;

    this.frameId = window.requestAnimationFrame(this.update);
  }
}
