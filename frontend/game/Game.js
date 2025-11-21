import WebGLCanvas from "./WebGLCanvas.js";
import DebugMenu from "./DebugMenu.js";
import Buffer from "./Buffer.js";
import * as mat3 from "../common/mat3.js";
import Player from "./Player.js";
import TextureManager from "./TextureManager.js";

export default class Game extends WebGLCanvas {
  constructor() {
    super();

    this.buffer = new Buffer();

    this.running = false;

    this.tickrate = 60;
    this.ticks = 0;
    this.frames = 0;
    this.timestep = 1000 / this.tickrate;
    this.alpha = 0;

    this.now = 0;
    this.last = 0;
    this.dt = 0;
    this.unprocessed = 0;
    this.maxUpdates = 5;

    this.tileSize = 15;
    this.scale = 1 / this.tileSize;
    this.cameraMatrix = mat3.identity();

    this.player = null;
    this.objects = [];
    this.enemies = [];
    this.projectiles = [];

    this.frameId = 0;

    this.debugMenu = null;
    this.textureManager = null;

    this.update = this.update.bind(this);
  }

  start() {
    if (!this.gl) {
      throw new Error(
        "GAME-start: Couldn't start game: WebGL hasn't been initalized!"
      );
    }
    if (!this.player) {
      throw new Error("GAME-start: Couldn't start game: there is no player.");
    }

    if (this.running) return;

    const textureManager = this.textureManager;

    // prettier-ignore
    Promise.all(textureManager.promises).then(
      () => {
        for (const { name, slot, offsetX, offsetY } of textureManager.textureCoordinateQueue) {
          textureManager.addTextureCoordinates(name, slot, offsetX, offsetY);
        }

        textureManager.loadFromActiveSlot();

        this.initInstancing(this);

        this.last = window.performance.now();
        this.frameId = window.requestAnimationFrame(this.update);
        this.running = true;
      },
      (error) => {
        throw new Error("Failed to load all textures: " + error);
      }
    );
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

    this.unprocessed = Math.min(
      this.unprocessed,
      this.maxUpdates * this.timestep
    );

    while (this.unprocessed >= this.timestep) {
      this.ticks++;
      this.tick(this.timestep / 1000);
      this.unprocessed -= this.timestep;
    }

    this.alpha = this.unprocessed / this.timestep;

    this.frames++;
    this.render(this.dt);

    this.frameId = window.requestAnimationFrame(this.update);
  }

  tick(dt) {
    this.player.save();

    this.player.update(this, dt);
    this.objects.forEach((object) => {
      object.save();
      object.update(this, dt);
    });
    this.enemies.forEach((enemy) => {
      enemy.save();
      enemy.update(this, dt);
    });
    this.projectiles.forEach((projectile) => {
      projectile.save();
      projectile.update(this, dt);
    });
  }

  // prettier-ignore
  render(dt) {
    const gl = this.gl;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.clearCanvas();

    this.dataCollector.length = 0;

    this.textureManager.updateSprites(dt);

    this.objects.forEach((object) => object.render(this));
    this.enemies.forEach((enemy) => enemy.render(this));
    this.projectiles.forEach((projectile) => projectile.render(this));
    this.player.render(this);

    const instanceCount = this.updateInstanceBuffer();

    if (instanceCount < 0) return;

    mat3.cam(this.cameraMatrix, this.aspectRatio, this.scale, this.alpha, this.player);
    gl.uniformMatrix3fv(this.uniform.cameraMatrix, false, this.cameraMatrix);

    this.draw(instanceCount);
  }

  createPlayer() {
    this.player = new Player();
  }

  /**
   * @param {TextureManager} textureManager
   */
  addTextureManager(textureManager) {
    if (!(textureManager instanceof TextureManager)) {
      console.warn(
        "GAME-addTextureManager: Couldn't add texture manager: the given value is not an instance of the TextureManager class!"
      );
      return;
    }

    this.textureManager = textureManager;
  }

  /**
   * @param {DebugMenu} debugMenu
   */
  setDebugMenu(debugMenu) {
    if (!(debugMenu instanceof DebugMenu)) {
      throw new Error(
        "GAME-setDebugMenu: The given argument is not an instance of the DebugMenu class."
      );
    }

    this.debugMenu = debugMenu;
  }

  startDebugging() {
    if (!this.debugMenu || !(this.debugMenu instanceof DebugMenu)) {
      console.warn(
        "GAME-stopDebugging: There is no Debug Menu on the Game instance!"
      );
      return;
    }

    this.debugMenu.show();
    this.debugMenu.startDebugUpdating();
  }

  stopDebugging() {
    if (!this.debugMenu || !(this.debugMenu instanceof DebugMenu)) {
      console.warn(
        "GAME-stopDebugging: There is no Debug Menu on the Game instance!"
      );
      return;
    }

    this.debugMenu.hide();
    this.debugMenu.stopDebugUpdating();
  }
}
