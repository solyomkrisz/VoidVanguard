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
import { getLocalSaves } from "/common/common.js";
import * as net from "/common/network.js";
import Save from "/game/Save.js";
import { setupGame } from "/game/setup/default.js";
import Models from "/game/SpaceShipModels.js";
import ToastManager from "/ui/component/feedback/ToastManager.js";

export default class Game extends WebGLCanvas {
  static from(save = null) {
    if (save == null || save.game_state == null) {
      const game = new Game();
      setupGame(game);
      return game;
    }

    let parsed;
    if (typeof save.game_state === "string")
      parsed = Save.parse(save.game_state);
    else parsed = save.game_state;

    const game = new Game(parsed.seed, parsed.game_id);
    game.loadedSave = save;
    setupGame(game, new Model(Save.recoverPlayerModel(parsed.player.model)));

    game.player.score = parsed.player.score;
    game.player.teleportTo(...parsed.player.position);

    return game;
  }

  constructor(seed = null, game_id = null) {
    super();

    this.game_id = game_id || crypto.randomUUID();
    this.loadedSave = null;
    this.saveType = null;
    this.inSavingProcess = false;
    this.isFinished = false;

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

    this.seed = seed ?? Math.floor(Math.random() * 100000); // 555 is nice, 46008, 676
    // this.seed = 555;
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

  async finishSave() {
    // Játék befejezése ha nem volt mentve
    if (!["local", "remote"].includes(this.saveType)) {
      ToastManager.REQUEST("Unable to finish game");
      return;
    }

    // Ha mentve volt
    if (this.saveType === "local") {
      const localSaves = getLocalSaves();

      localSaves.set(this.game_id, {
        ...this.loadedSave,
        game_id: this.game_id,
        game_state: this.exportSave(),
        is_finished: 1,
        updated_at: Date.now(),
      });

      localStorage.setItem("localSaves", JSON.stringify([...localSaves]));

      return;
    }

    const formData = new FormData();

    formData.set("game_id", this.game_id);
    formData.set("is_finished", "1");
    formData.set("game_state", JSON.stringify(this.exportSave()));

    const response = await net.send("/api/saves", {
      method: "PATCH",
      body: formData,
    });

    if (!response?.success) {
      console.error(
        `Unable to finish game: ${response?.message ? response.message : ""}`,
      );
      ToastManager.REQUEST(
        `Unable to finish game: ${response?.message ? response.message : ""}`,
      );

      return;
    }

    console.log("Game has been marked as finished remotely.");
    ToastManager.REQUEST("Game has been marked as finished remotely.");

    // kiléptetés vagy endscreen mutatása
  }

  destroy() {
    // from Canvas class
    {
      this.canvas.remove?.();
      this.contextMenu?.remove();
    }

    // own
    {
      for (const key of Object.keys(this.UI)) {
        this.UI[key].remove?.();
      }

      this.tooltip?.remove?.();

      this.debugPanel?.destroy();
      this.debugOverlay?.destroy();
    }

    this.player?.destroy();
  }

  buildUI() {
    this.UI.pauseMenu = document.createElement("pause-menu");
    this.UI.pauseMenu.game = this;
    document.body.appendChild(this.UI.pauseMenu);
  }

  exportSave() {
    this.game_id = this.game_id || crypto.randomUUID();

    return {
      game_id: this.game_id,
      seed: this.seed,
      player: this.player.exportSave(),
      // enemies: this.enemies,
      // buildingBlocks: this.buildingBlocks,
    };
  }

  localSave(formData) {
    if (this.inSavingProcess) return;
    this.inSavingProcess = true;

    const saveName = formData.get("save_name") || "Unnamed Save";

    let localSaves = getLocalSaves();

    const existingSave = localSaves.get(this.game_id);
    const created_at = existingSave?.created_at || Date.now();

    localSaves.set(this.game_id, {
      game_id: this.game_id,
      save_name: saveName,
      game_state: this.exportSave(),
      is_finished: 0,
      created_at,
      updated_at: Date.now(),
    });

    window.localStorage.setItem("localSaves", JSON.stringify([...localSaves]));

    console.log("Game state has been saved locally as " + saveName);
    ToastManager.REQUEST("Game state has been saved locally as " + saveName);

    this.inSavingProcess = false;

    return true;
  }

  async remoteSave(formData) {
    if (this.inSavingProcess) return;
    this.inSavingProcess = true;

    console.log(this.game_id);
    formData.set("game_id", this.game_id);
    formData.set("game_state", JSON.stringify(this.exportSave()));

    const response = await net.send("/api/saves", {
      method: "PUT",
      body: formData,
    });

    if (!response?.success) {
      console.error(
        `Unable to save game: ${response?.message ? response.message : ""}`,
      );
      ToastManager.REQUEST(
        `Unable to save game: ${response?.message ? response.message : ""}`,
      );

      this.inSavingProcess = false;
      return false;
    }

    const saveName = formData.get("save_name");

    console.log("Game state has been saved remotely as " + saveName);
    ToastManager.REQUEST("Game state has been saved remotely as " + saveName);

    this.inSavingProcess = false;

    return true;
  }

  async save(formData) {
    if (!formData) {
      console.error("Unable to save game: invalid format");
      ToastManager.REQUEST("Unable to save game: invalid format");

      return false;
    }

    const type = formData.get("save_type") || "local";

    if (type === "local") {
      return this.localSave(formData);
    } else if (type === "remote") {
      return await this.remoteSave(formData);
    }

    return false;
  }

  // prettier-ignore
  initTextureArray() {
    const gl = this.gl;

    this.textureArray = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.textureArray);
    gl.texStorage3D(
      gl.TEXTURE_2D_ARRAY,
      1,
      gl.RGBA8,
      DecorationBlock.TEXTURE_WIDTH,
      DecorationBlock.TEXTURE_HEIGHT,
      this.maxLayers,
    );

    const initialTexture = new Uint8Array(
      DecorationBlock.TEXTURE_WIDTH *
      DecorationBlock.TEXTURE_HEIGHT *
      4 *
      this.maxLayers,
    );
    //
    gl.texSubImage3D(
      gl.TEXTURE_2D_ARRAY,
      0,
      0, 0, 0,
      DecorationBlock.TEXTURE_WIDTH,
      DecorationBlock.TEXTURE_HEIGHT,
      this.maxLayers,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      initialTexture,
    );
    //

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
    this.tooltip.disable();
    this.UI.pauseMenu?.show();
  }

  resume() {
    this.tooltip.enable();
    this.UI.pauseMenu.hide();

    this.last = window.performance.now();
    this.frameId = window.requestAnimationFrame(this.update);
    this.running = true;
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
    this.dirty = true;

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
    if (!(model instanceof Model)) {
      throw new Error(
        "Unable to create player: the provided argument is not a Model",
      );
    }

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

  setBlockStyle(blockStyle) {
    if (!(blockStyle instanceof BlockStyle)) {
      throw new Error(
        "GAME-setBlockStyle: The given argument is not an instance of the BlockStyle class.",
      );
    }

    this.blockStyle = blockStyle;
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
