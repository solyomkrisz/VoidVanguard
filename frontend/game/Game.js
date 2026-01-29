import WebGLCanvas from "./WebGLCanvas.js";
import DebugPanel from "./DebugPanel.js";
import Buffer from "./Buffer.js";
import * as mat3 from "../common/mat3.js";
import Player from "./Player.js";
import TextureManager from "./TextureManager.js";
import Grid from "./Grid.js";
import DebugOverlay from "./DebugOverlay.js";
import IDManager from "./IDManager.js";
import ObjectCollection from "./ObjectCollection.js";
import * as UI from "../ui/UI.js";
import _ from "../ui/component/DynamicTooltip.js";
import { ValueNoise, PerlinNoise } from "../common/noise.js";
import ChunkManager from "./ChunkManager.js";
import * as vec2 from "../common/vec2.js";
import NebulaGenerator from "./texture/NebulaGenerator.js";
import DecorationBlock from "./DecorationBlock.js";

export default class Game extends WebGLCanvas {
  constructor() {
    super();

    this.tooltip = UI.element("dynamic-tooltip");
    document.body.appendChild(this.tooltip);
    this.buffer = new Buffer();

    this.running = false;

    this.tickrate = 30;
    this.ticks = 0;
    this.frames = 0;
    this.timestep = 1000 / this.tickrate;
    this.fdt = this.timestep / 1000;
    this.alpha = 0;

    this.now = 0;
    this.last = 0;
    this.vdt = 0;
    this.unprocessed = 0;
    this.maxUpdates = 5;
    this.iterationCount = 6;

    this.idManager = new IDManager();
    this.grid = new Grid(this, 10);
    this.objects = new ObjectCollection(this);

    this.seed = Math.floor(Math.random() * 100000); // 555 is nice, 46008
    this.seed = 555;
    this.noise = new ValueNoise(this.seed);
    this.noiseScale = 1 / 15;
    // prettier-ignore
    this.ng = new NebulaGenerator(this.noise, this.noiseScale, DecorationBlock.TEXTURE_WIDTH, DecorationBlock.TEXTURE_HEIGHT, this.clearColor);

    this.tileSize = 15;
    this.chunkSize = 16;
    this.renderDistance = vec2.fromValues(1, 1);
    this.chunks = new ChunkManager(this);

    this.textureArray = null;
    // prettier-ignore
    this.maxLayers = ((2 * this.renderDistance[0]) * (2 * this.renderDistance[1])) * (this.chunkSize * this.chunkSize);
    this.layerId = new IDManager(this.maxLayers);

    this.scale = 1 / this.tileSize;
    this.cameraMatrix = mat3.identity();
    this.cameraMatrixInverse = mat3.identity();

    this.player = null;
    this.mouse = null;
    this.enemies = new ObjectCollection(this);
    this.buildingBlocks = new ObjectCollection(this);
    this.projectiles = new ObjectCollection(this);
    this.coreObjects = new ObjectCollection(this);

    this.frameId = 0;

    this.debugPanel = null;
    this.debugOverlay = null;
    this.textureManager = null;

    this.update = this.update.bind(this);
  }

  // prettier-ignore
  initTextureArray() {
    const gl = this.gl;

    this.textureArray = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.textureArray);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, DecorationBlock.TEXTURE_WIDTH, DecorationBlock.TEXTURE_HEIGHT, this.maxLayers);

    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);

    this.lastLayer = 0;
  }

  bindTextureArray() {
    const gl = this.gl;

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.textureArray);
    gl.uniform1i(this.uniform.textureArray, 1);
  }

  start() {
    if (!this.gl) {
      throw new Error(
        "GAME-start: Couldn't start game: WebGL hasn't been initalized!",
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

        this.initTextureArray();
        this.bindTextureArray();

        this.initInstancing(this);
        
        this.gl.uniform4fv(this.uniform.backgroundColor, this.clearColor);
        // this.gl.uniform1fv(this.uniform.r, this.noise.r);
        // this.gl.uniform1iv(this.uniform.p, this.noise.p);
        // this.gl.uniform1f(this.uniform.noiseScale, this.noiseScale);

        const error = this.gl.getError();

        error !== this.gl.NO_ERROR && console.error("WebGL Error: ", error);

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
    this.vdt = this.now - this.last;
    this.last = this.now;

    this.unprocessed += this.vdt;

    this.unprocessed = Math.min(
      this.unprocessed,
      this.maxUpdates * this.timestep,
    );

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

  tick() {
    this.tooltip.hide();
    this.tooltip.displayed = false;
    this.contextMenu.hovered = null;

    this.coreObjects.update(); // az egér is itt van és a drag miatt input-nak számít tehát muszáj felül lennie
    this.enemies.update();
    this.projectiles.update();
    this.buildingBlocks.update();

    this.chunks.update();

    // prettier-ignore
    this.objects.merge(this.coreObjects, this.enemies, this.projectiles, this.buildingBlocks);
    this.grid.filter().iterate();

    this.tooltip.updateTemplates(this.frameId);
  }

  // prettier-ignore
  render() {
    if (this.debugOverlay) {
      this.debugOverlay.clearCanvas();
      this.grid.debug();
    }

    this.bindTextureArray();

    const gl = this.gl;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.clearCanvas();

    this.dataCollector.length = 0;

    this.textureManager.loadFromActiveSlot(); // Remove if no dynamic textures are created
    this.textureManager.updateSprites();

    this.chunks.render(); // render first so it will be in the background

    this.enemies.render();
    this.projectiles.render();
    this.buildingBlocks.render();
    this.coreObjects.render();

    const instanceCount = this.updateInstanceBuffer();

    if (instanceCount < 0) return;

    mat3.cam(this.cameraMatrix, this.aspectRatio, this.scale, this.alpha, this.player);
    mat3.camInverse(this.cameraMatrixInverse, this.aspectRatio, this.scale, this.alpha, this.player);
    gl.uniformMatrix3fv(this.uniform.cameraMatrix, false, this.cameraMatrix);

    this.draw(instanceCount);
  }

  createPlayer(model) {
    this.player = new Player(this, model);
    this.coreObjects.add(this.player);
  }

  /**
   * @param {TextureManager} textureManager
   */
  addTextureManager(textureManager) {
    if (!(textureManager instanceof TextureManager)) {
      console.warn(
        "GAME-addTextureManager: Couldn't add texture manager: the given value is not an instance of the TextureManager class!",
      );
      return;
    }

    this.textureManager = textureManager;
  }

  /**
   * @param {DebugPanel} debugPanel
   */
  setDebugPanel(debugPanel) {
    if (!(debugPanel instanceof DebugPanel)) {
      throw new Error(
        "GAME-setDebugPanel: The given argument is not an instance of the DebugPanel class.",
      );
    }

    this.debugPanel = debugPanel;
  }

  setDebugOverlay(debugOverlay) {
    if (!(debugOverlay instanceof DebugOverlay)) {
      throw new Error(
        "GAME-setDebugOverlay: The given argument is not an instance of the DebugOverlay class.",
      );
    }

    this.debugOverlay = debugOverlay;
  }

  startDebugging() {
    if (!this.debugPanel || !(this.debugPanel instanceof DebugPanel)) {
      console.warn(
        "GAME-stopDebugging: There is no Debug Menu on the Game instance!",
      );
      return;
    }

    this.debugPanel.show();
    this.debugPanel.startDebugUpdating();
  }

  stopDebugging() {
    if (!this.debugPanel || !(this.debugPanel instanceof DebugPanel)) {
      console.warn(
        "GAME-stopDebugging: There is no Debug Menu on the Game instance!",
      );
      return;
    }

    this.debugPanel.hide();
    this.debugPanel.stopDebugUpdating();
  }
}
