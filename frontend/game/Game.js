import WebGLCanvas from "./WebGLCanvas.js";
import * as mat3 from "../common/mat3.js";

export default class Game extends WebGLCanvas {
  constructor() {
    super();

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

    this.tileSize = 15;
    this.scale = 1 / this.tileSize;
    this.cameraMatrix = mat3.identity();

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
      this.tick();
      this.unprocessed -= this.timestep;
    }

    this.alpha = this.unprocessed / this.timestep;

    this.frames++;
    this.render();

    this.frameId = window.requestAnimationFrame(this.update);
  }

  tick() {}

  // prettier-ignore
  render() {
    const gl = this.gl;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.clearCanvas();

    mat3.cam(this.cameraMatrix, this.aspectRatio, this.scale);
    gl.uniformMatrix3fv(this.cameraMatrixUniformLocation, false, this.cameraMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
