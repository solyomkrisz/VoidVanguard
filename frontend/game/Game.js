import WebGLCanvas from "/game/WebGLCanvas.js";
import DebugPanel from "/game/DebugPanel.js";
import Buffer from "/game/Buffer.js";
import * as mat3 from "/common/mat3.js";
import Player from "/game/Player.js";
import TextureManager from "/game/TextureManager.js";
import Grid from "/game/Grid.js";
import DebugOverlay from "/game/DebugOverlay.js";
import BlockStyle from "/game/BlockStyle.js";
import IDManager from "/game/IDManager.js";
import ObjectCollection from "/game/ObjectCollection.js";
import * as UI from "/ui/UI.js";
import _ from "/ui/component/game/DynamicTooltip.js";
import { ValueNoise, PerlinNoise } from "/common/noise.js";
import ChunkManager from "/game/ChunkManager.js";
import * as vec2 from "/common/vec2.js";
import NebulaGenerator from "/game/texture/NebulaGenerator.js";
import DecorationBlock from "/game/DecorationBlock.js";
import StarGenerator from "/game/texture/StarGenerator.js";
import Model from "/game/Model.js";
import "/ui/component/game/PauseMenu.js";
import { isLoggedIn } from "/common/common.js";
import * as net from "/common/network.js";

export default class Game extends WebGLCanvas {
  constructor() {
    super();

    this.inSavingProcess = false;

    this.UI = {};
    this.buildUI();

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

    this.seed = Math.floor(Math.random() * 100000); // 555 is nice, 46008, 676
    this.seed = 555;
    this.noise = new ValueNoise(this.seed);
    this.noiseScale = 1 / 10;
    // prettier-ignore
    {
      this.ng = new NebulaGenerator(this.noise, this.noiseScale, DecorationBlock.TEXTURE_WIDTH, DecorationBlock.TEXTURE_HEIGHT, this.clearColor);
      this.sg = new StarGenerator(this.noise, DecorationBlock.TEXTURE_WIDTH, DecorationBlock.TEXTURE_HEIGHT);
    }

    this.tileSize = 14;
    this.backgroundZoom = 2;
    this.nebulaParallax = 0.15;
    // Minimum star parallax — must match the lower bound of the formula in DecorationBlock
    // nebulaParallax * (0.01 + distanceFactor_min(0.3) * 0.15) = nebulaParallax * 0.055
    this.minStarParallax = this.nebulaParallax * 0.055;
    this.chunkSize = 8;
    this.renderDistance = vec2.fromValues(3, 2);
    this.chunks = new ChunkManager(this);

    this.textureArray = null;
    // prettier-ignore
    this.maxLayers = -1;
    this.layerId = null;

    this.scale = 1 / this.tileSize;
    this.cameraMatrix = mat3.identity();
    this.cameraMatrixInverse = mat3.identity();

    this.player = null;
    this.mouse = null;
    this.enemies = new ObjectCollection(this);
    this.buildingBlocks = new ObjectCollection(this);
    this.projectiles = new ObjectCollection(this);
    this.coreObjects = new ObjectCollection(this);

    this.debugPanel = null;
    this.debugOverlay = null;
    this.blockStyle = null;
    this.textureManager = null;

    this.showNebula = true;
    this.showSpaceGrid = true;
    this.showChunkDebug = false;
    this.showEntityIds = false;
    this.showGridCells = false;
    this.showSpaceshipCircle = false;
    this.showSpaceshipHitbox = false;

    this.update = this.update.bind(this);
  }

  buildUI() {
    this.UI.pauseMenu = document.createElement("pause-menu");
    this.UI.pauseMenu.game = this;
    document.body.appendChild(this.UI.pauseMenu);
  }

  exportSave() {
    return {
      seed: this.seed,
      player: this.player.exportSave(),
      // enemies: this.enemies,
      // buildingBlocks: this.buildingBlocks,
    };
  }

  fromSave(gameState) {
    if (!gameState.player || !gameState.enemies) {
      throw new Error("Invalid game state");
    }

    this.player = new Player(this, new Model([])).from(gameState.player);

    for (const enemy of gameState.enemies) {
    }
  }

  async saveCurrentStateAs(formData) {
    if (this.inSavingProcess) return;

    const slotName = formData.get("slotName");

    if (!slotName) {
      console.error("Unable to save game: no slot name provided");
      return;
    }

    this.inSavingProcess = true;

    if (!isLoggedIn()) {
      window.localStorage.setItem(slotName, JSON.stringify(this.exportSave()));
      console.log("Game state has been saved locally as " + slotName);
      this.inSavingProcess = false;

      return;
    }

    // if logged in
    formData.append("gameState", this.exportSave());

    const response = await net.send("/api/saves", {
      method: "POST",
      body: formData,
    });

    this.inSavingProcess = false;

    if (!response?.success) {
      console.error(
        `Unable to save game: ${response?.message ? response.message : ""}`
      );
      return;
    }

    console.log(
      `GAME-saveCurrentStateAs: ${response?.message ? response.message : ""}`
    );
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
        "GAME-start: Couldn't start game: WebGL hasn't been initalized!"
      );
    }
    if (!this.player) {
      throw new Error("GAME-start: Couldn't start game: there is no player.");
    }

    if (this.running) return;

    const gl = this.gl;
    const textureManager = this.textureManager;

    // prettier-ignore
    Promise.all(textureManager.promises).then(
      () => {
        for (const { name, slot, offsetX, offsetY } of textureManager.textureCoordinateQueue) {
          textureManager.addTextureCoordinates(name, slot, offsetX, offsetY);
        }

        textureManager.loadFromActiveSlot();

        this.maxLayers = gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS);

        if (this.maxLayers < ((2 * this.renderDistance[0]) * (2 * this.renderDistance[1])) * (this.chunkSize * this.chunkSize)) {
          console.error("GAME-start: The number of textures required for the chunks within the render distance exceeds the maximum allowed texture slots!");
        }

        this.layerId = new IDManager(this.maxLayers);

        this.initTextureArray();
        this.bindTextureArray();

        this.initInstancing(this);
        
        gl.uniform4fv(this.uniform.backgroundColor, this.clearColor);
        gl.uniform1f(this.uniform.backgroundZoom, this.backgroundZoom);
        // this.gl.uniform1fv(this.uniform.r, this.noise.r);
        // this.gl.uniform1iv(this.uniform.p, this.noise.p);
        // this.gl.uniform1f(this.uniform.noiseScale, this.noiseScale);

        const error = gl.getError();

        error !== gl.NO_ERROR && console.error("WebGL Error: ", error);

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
    this.UI.pauseMenu?.show();
  }

  resume() {
    this.UI.pauseMenu.hide();
    this.start();
  }

  update() {
    this.now = window.performance.now();
    this.vdt = this.now - this.last;
    this.last = this.now;

    this.unprocessed += this.vdt;

    this.unprocessed = Math.min(
      this.unprocessed,
      this.maxUpdates * this.timestep
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
  drawSpaceGrid() {
    const ctx = this.debugOverlay.ctx;
    const W = this.debugOverlay.canvas.width;
    const H = this.debugOverlay.canvas.height;
    const gridSize = 2; // 2×2 blocks per cell

    const [ppx, ppy] = this.player.previousPosition;
    const [pcx, pcy] = this.player.position;
    const px = ppx + (pcx - ppx) * this.alpha;
    const py = ppy + (pcy - ppy) * this.alpha;

    // mat3.cam scale calculation - therefor grid always matches the camera
    let scaleX = this.scale, scaleY = this.scale;
    if (this.aspectRatio >= 1) scaleX = this.scale / this.aspectRatio;
    else                       scaleY = this.scale * this.aspectRatio;
    const ppuX = scaleX * W / 2;
    const ppuY = scaleY * H / 2;

    const halfW = W / (2 * ppuX);
    const halfH = H / (2 * ppuY);

    const x0 = Math.floor((px - halfW) / gridSize) * gridSize;
    const y0 = Math.floor((py - halfH) / gridSize) * gridSize;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let wx = x0; wx <= px + halfW + gridSize; wx += gridSize) {
      const sx = (wx - px) * ppuX + W / 2;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, H);
    }

    for (let wy = y0; wy <= py + halfH + gridSize; wy += gridSize) {
      const sy = H / 2 - (wy - py) * ppuY;
      ctx.moveTo(0, sy);
      ctx.lineTo(W, sy);
    }

    ctx.stroke();
    ctx.restore();
  }

  // prettier-ignore
  render() {
    if (this.debugOverlay) {
      this.debugOverlay.clearCanvas();
      if (this.showSpaceGrid) {
        this.drawSpaceGrid();
      }
      if (this.showGridCells) {
        this.grid.debug();
      }
    }

    if (this.blockStyle) {
      this.blockStyle.clearCanvas();
    }
    
    this.bindTextureArray();

    const gl = this.gl;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.clearCanvas();

    this.dataCollector.length = 0;

    this.textureManager.loadFromActiveSlot(); // Remove if no dynamic textures are created
    this.textureManager.updateSprites();

    this.chunks.render(); // nebula pass then star pass, so stars always draw on top

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
        "GAME-addTextureManager: Couldn't add texture manager: the given value is not an instance of the TextureManager class!"
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
        "GAME-setDebugPanel: The given argument is not an instance of the DebugPanel class."
      );
    }

    this.debugPanel = debugPanel;
  }

  setDebugOverlay(debugOverlay) {
    if (!(debugOverlay instanceof DebugOverlay)) {
      throw new Error(
        "GAME-setDebugOverlay: The given argument is not an instance of the DebugOverlay class."
      );
    }

    this.debugOverlay = debugOverlay;
  }

  setBlockStyle(blockStyle) {
    if (!(blockStyle instanceof BlockStyle)) {
      throw new Error(
        "GAME-setBlockStyle: The given argument is not an instance of the BlockStyle class."
      );
    }

    this.blockStyle = blockStyle;
  }

  startDebugging() {
    if (!this.debugPanel || !(this.debugPanel instanceof DebugPanel)) {
      console.warn(
        "GAME-stopDebugging: There is no Debug Menu on the Game instance!"
      );
      return;
    }

    this.debugPanel.show();
    this.debugPanel.startDebugUpdating();
  }

  stopDebugging() {
    if (!this.debugPanel || !(this.debugPanel instanceof DebugPanel)) {
      console.warn(
        "GAME-stopDebugging: There is no Debug Menu on the Game instance!"
      );
      return;
    }

    this.debugPanel.hide();
    this.debugPanel.stopDebugUpdating();
  }
}
