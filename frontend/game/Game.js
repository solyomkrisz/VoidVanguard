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
import Enemy from "/game/Enemy.js";
import { createEnemyModelByDifficulty } from "/game/SpaceShipModels.js";
import ToastManager from "/ui/component/feedback/ToastManager.js";
import "/ui/component/game/GameControllerContainer.js";
import "/ui/component/game/PauseButton.js";
import AudioManager from "/common/AudioManager.js";
import NetworkErrorHandler from "/common/NetworkErrorHandler.js";
import { GlobalState } from "/game/State.js";
import "/ui/component/game/DeathScreen.js";

// Difficulty thresholds are based on spaceship-destruction score progression.
// Index = difficulty level, value = minimum score required for that level.
const DIFFICULTY_SCORE_THRESHOLDS = Object.freeze([
  0, // 0
  250, // 1
  700, // 2
  1350, // 3
  2200, // 4
  3250, // 5
  4500, // 6
  5950, // 7
  7600, // 8
  9450, // 9
  11500, // 10
  13750, // 11
  16200, // 12
  18850, // 13
  21700, // 14
  24750, // 15
]);

export default class Game extends WebGLCanvas {
  /**
   * FNV-1a hash of a string → deterministic uint32.
   * Used to derive a stable noise seed from a game_id so the world layout
   * is always the same for the same game session, even without a saved seed.
   */
  static seedFromId(id) {
    let h = 0x811c9dc5;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h;
  }

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
    setupGame(game, new Model(Save.recoverModelObjects(parsed.player.model)));

    for (const enemy of parsed.enemies) {
      game.enemies.add(Save.recoverEntity(enemy, game));
    }

    game.player.score = parsed.player.score;
    game.player.rotation = parsed.player.rotation ?? 0;
    game.player.teleportTo(...parsed.player.position);
    game.player.rotation = parsed.player.rotation;

    game.activeControls.add("EngineIgnite");
    game.player.UI.flightComputer.setAutopilot(true);

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

    this.tickrate = 60;
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

    //this.seed = seed ?? Game.seedFromId(this.game_id);
    this.seed = 1000;
    this.noise = new ValueNoise(this.seed);
    this.noiseScale = 1 / 10;
    // prettier-ignore
    {
      this.ng = new NebulaGenerator(this.noise, this.noiseScale, DecorationBlock.TEXTURE_WIDTH, DecorationBlock.TEXTURE_HEIGHT, this.clearColor);
      this.sg = new StarGenerator(this.noise, DecorationBlock.TEXTURE_WIDTH, DecorationBlock.TEXTURE_HEIGHT);
    }

    this.tileSize = this.getDefaultTileSize();
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

    this.activeControls = new Set();
    this.controllers = new Map();
    this.player = null;
    this.mouse = null;
    this.enemies = new ObjectCollection(this);
    this.buildingBlocks = new ObjectCollection(this);
    this.projectiles = new ObjectCollection(this);
    this.coreObjects = new ObjectCollection(this);
    this.blockDestructionParticles = [];

    this.debugPanel = null;
    this.debugOverlay = null;
    this.blockStyle = null;
    this.textureManager = null;
    this.audioManager = null;

    this.showNebula = true;
    this.showSpaceGrid = true;
    this.showChunkDebug = false;
    this.showEntityIds = false;
    this.showGridCells = false;
    this.showSpaceshipCircle = false;
    this.showSpaceshipHitbox = false;

    this._textureBuildQueue = [];

    this.enemySpawnerInitialized = false;
    this.enemySpawnInterval = 18;
    this.enemySpawnTimer = this.enemySpawnInterval;
    this.enemyInitialCount = 25;
    this.enemySpawnCellArea = 15; // 15x15 grid-cell spawn area around player
    this.enemySpawnMinDistance = 28;
    this.enemySpawnMaxDistance = 52;
    this.enemySpawnMinSpacing = 12;
    this.enemyCapTargetWidth = 12;
    this.enemyCapTargetHeight = 12;
    this.enemyRngState = (this.seed ^ 0xa341316c) >>> 0;

    this.currentDifficulty = 0;
    this.lastDisplayedScore = null;

    this.update = this.update.bind(this);

    this.inBuilderView = false;
  }

  startBackgroundMusic() {
    this.audioManager.getSound("backgroundmusic")?.instance?.start?.();
  }

  resumeBackgroundMusic() {
    this.audioManager.getSound("backgroundmusic")?.instance?.resume?.();
  }

  pauseBackgroundMusic() {
    this.audioManager.getSound("backgroundmusic")?.instance?.pause?.();
  }

  stopBackgroundMusic() {
    this.audioManager.getSound("backgroundmusic")?.instance?.stop?.();
  }

  getDefaultTileSize() {
    if ((this.player?.proxyCollider?.r ?? 0) > 14) {
      return this.player.proxyCollider.r;
    }

    return 14;
  }

  setTileSize(tileSize) {
    this.tileSize = tileSize;
    this.scale = 1 / this.tileSize;
  }

  toggleBuilderView() {
    if (this.inBuilderView) {
      this.setTileSize(this.getDefaultTileSize());
    } else {
      this.setTileSize(Math.ceil(this.player.proxyCollider.r + 3));
    }

    this.inBuilderView = !this.inBuilderView;
  }

  randomFloat() {
    this.enemyRngState =
      (Math.imul(this.enemyRngState, 1664525) + 1013904223) >>> 0;
    return this.enemyRngState / 4294967296;
  }

  randomInt(min, max) {
    return min + Math.floor(this.randomFloat() * (max - min + 1));
  }

  getCurrentDifficulty() {
    const score = this.player?.score ?? 0;
    for (let difficulty = DIFFICULTY_SCORE_THRESHOLDS.length - 1; difficulty >= 0; difficulty--) {
      if (score >= DIFFICULTY_SCORE_THRESHOLDS[difficulty]) return difficulty;
    }
    return 0;
  }

  getEnemyCapByDifficulty(difficulty) {
    const d = Math.max(0, difficulty);
    const baselineMin = this.enemyInitialCount;
    const baselineMax = this.enemyInitialCount + 30;
    const normalized = Math.min(1, d / 15);
    const scaledCap = baselineMin + normalized * (baselineMax - baselineMin);
    return Math.round(scaledCap);
  }

  getEnemySpawnIntervalByDifficulty(difficulty) {
    const d = Math.max(0, difficulty);
    const maxInterval = 18;
    const minInterval = 6;
    const normalized = Math.min(1, d / 15);
    return maxInterval + (minInterval - maxInterval) * normalized;
  }

  pulseHudValue(element) {
    if (!element?.animate) return;
    element.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.2)" },
        { transform: "scale(1)" },
      ],
      {
        duration: 230,
        easing: "cubic-bezier(0.2, 0.9, 0.25, 1)",
      },
    );
  }

  updateDifficultyIndicator() {
    const score = this.player?.score ?? 0;
    const difficulty = this.getCurrentDifficulty();
    this.currentDifficulty = difficulty;
    const gradeIndex = Math.max(0, Math.min(14, difficulty - 1));
    const difficultyColor = BlockStyle.GRADE_COLORS[gradeIndex] || BlockStyle.GRADE_COLORS[0];

    const stars = difficulty > 0 ? "★".repeat(difficulty) : "☆";
    const scoreIncreased =
      this.lastDisplayedScore != null && score > this.lastDisplayedScore;

    if (this.UI.difficultyText && this.UI.difficultyValue && this.UI.scoreValue) {
      this.UI.difficultyText.style.color = difficultyColor;
      this.UI.difficultyValue.textContent = stars;
      this.UI.difficultyValue.style.color = difficultyColor;
      this.UI.scoreValue.textContent = String(score);
      this.UI.scoreValue.style.color = "#f3f7ff";

      if (scoreIncreased) {
        this.pulseHudValue(this.UI.scoreValue);
      }
    }

    this.lastDisplayedScore = score;
  }

  pickEnemyBehavior(difficulty) {
    const r = this.randomFloat();

    if (difficulty <= 3) {
      if (r < 0.4) return "passive";
      if (r < 0.8) return "neutral";
      return "aggressive";
    }

    if (difficulty <= 9) {
      if (r < 0.18) return "rammer";
      if (r < 0.55) return "neutral";
      return "aggressive";
    }

    if (r < 0.22) return "rammer";
    if (r < 0.42) return "neutral";
    return "aggressive";
  }

  getPlayerChunk() {
    const cx = Math.floor(
      this.player.position[0] / this.chunkSize / this.backgroundZoom,
    );
    const cy = Math.floor(
      this.player.position[1] / this.chunkSize / this.backgroundZoom,
    );
    return [cx, cy];
  }

  getPlayerGridCell() {
    const cx = Math.floor(this.player.position[0] / this.grid.cellSize);
    const cy = Math.floor(this.player.position[1] / this.grid.cellSize);
    return [cx, cy];
  }

  isChunkVisibleToPlayer(cx, cy) {
    const [pcx, pcy] = this.getPlayerChunk();
    const visX = this.renderDistance[0] + 1;
    const visY = this.renderDistance[1] + 1;
    return Math.abs(cx - pcx) <= visX && Math.abs(cy - pcy) <= visY;
  }

  trySpawnEnemy(difficulty) {
    if (!this.player) return false;

    const chunkWorldSize = this.chunkSize * this.backgroundZoom;
    const minSpawnDistance = Math.max(chunkWorldSize * 1.5, this.enemySpawnMinDistance);
    const maxSpawnDistance = Math.max(minSpawnDistance + 10, this.enemySpawnMaxDistance);
    const minSpawnSpacing = this.enemySpawnMinSpacing;

    for (let attempt = 0; attempt < 80; attempt++) {
      const angle = this.randomFloat() * Math.PI * 2;
      const spawnDistance = minSpawnDistance + this.randomFloat() * (maxSpawnDistance - minSpawnDistance);
      const x = this.player.position[0] + Math.cos(angle) * spawnDistance;
      const y = this.player.position[1] + Math.sin(angle) * spawnDistance;
      const distanceToPlayer = spawnDistance;

      if (distanceToPlayer < minSpawnDistance || distanceToPlayer > maxSpawnDistance) continue;

      let tooCloseToEnemy = false;
      for (const enemy of this.enemies.objects) {
        if (Math.hypot(enemy.position[0] - x, enemy.position[1] - y) < minSpawnSpacing) {
          tooCloseToEnemy = true;
          break;
        }
      }
      if (tooCloseToEnemy) continue;

      const behavior = this.pickEnemyBehavior(difficulty);
      const spawnArchetype = behavior === "rammer" ? "RAMMER" : "AUTO";
      const enemyBlueprint = createEnemyModelByDifficulty(
        difficulty,
        spawnArchetype,
        () => this.randomFloat(),
      );
      const enemy = new Enemy({
        game: this,
        model: enemyBlueprint.model,
        x,
        y,
        maxSpeed: enemyBlueprint.maxSpeed,
        turnRate: enemyBlueprint.turnRate,
        behavior,
        difficulty,
      });

      this.enemies.add(enemy);
      enemy.model.applyTextureRotations(this.textureManager);
      enemy.model.onBlockDestroyed = (block) => this._spawnBlockDestructionAt(block, enemy);
      return true;
    }

    return false;
  }

  initializeEnemySpawner() {
    if (this.enemySpawnerInitialized || !this.player) return;

    this.enemySpawnerInitialized = true;
    this.enemySpawnTimer = this.enemySpawnInterval;

    if (this.enemies.objects.length > 0) return;

    const difficulty = this.getCurrentDifficulty();
    for (let i = 0; i < this.enemyInitialCount; i++) {
      this.trySpawnEnemy(difficulty);
    }
  }

  updateEnemySpawner() {
    if (!this.player) return;

    if (!this.enemySpawnerInitialized) {
      this.initializeEnemySpawner();
    }

    const difficulty = this.getCurrentDifficulty();
    const spawnInterval = this.getEnemySpawnIntervalByDifficulty(difficulty);
    const cap = this.getEnemyCapByDifficulty(difficulty);
    const deficit = cap - this.enemies.objects.length;

    // Always count down so a free slot triggers a spawn without a full extra wait.
    this.enemySpawnTimer = Math.min(this.enemySpawnTimer, spawnInterval);
    this.enemySpawnTimer -= this.fdt;
    if (this.enemySpawnTimer > 0) return;

    if (deficit <= 0) {
      // Cap is full — reload the timer and wait for the next free slot.
      this.enemySpawnTimer = spawnInterval;
      return;
    }

    // Spawn one enemy; use a shorter interval while the arena is significantly
    // below cap so recovery after a burst of kills feels immediate.
    if (this.trySpawnEnemy(difficulty)) {
      const catchUp = deficit > 1
        ? Math.max(2, spawnInterval / Math.min(deficit, 4))
        : spawnInterval;
      this.enemySpawnTimer = catchUp;
    } else {
      this.enemySpawnTimer = Math.min(5, spawnInterval);
    }
  }

  async finishSave() {
    // Játék befejezése ha nem volt mentve
    if (!["local", "remote"].includes(this.saveType)) {
      ToastManager.REQUEST(
        "A játékot nem lehet befejezne: ismeretlen mentéstípus",
      );
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

    if (NetworkErrorHandler.handle(response)) {
      return;
    }

    ToastManager.REQUEST("A játék meg lett jelölve befejezettként");

    // kiléptetés vagy endscreen mutatása
  }

  destroy() {
    this.stop();

    // from Canvas class
    {
      this.canvas.remove?.();
      this.contextMenu?.remove();
    }

    // own
    {
      for (const key of Object.keys(this.UI)) {
        this.UI[key].destroy?.();
      }

      for (const value of this.controllers.values()) {
        value.destroy?.();
      }

      this.tooltip?.remove?.();
      this.UI.difficultyLabel?.remove?.();

      this.debugPanel?.destroy();
      this.debugOverlay?.destroy();
    }

    this.player?.destroy();
  }

  // prettier-ignore
  buildUI() {
    this.UI.pauseMenu = document.createElement("pause-menu");
    this.UI.pauseMenu.game = this;
    document.body.appendChild(this.UI.pauseMenu);

    this.UI.deathScreen = document.createElement("death-screen");
    this.UI.deathScreen.game = this;
    document.body.appendChild(this.UI.deathScreen);

    this.UI.controllerContainer = document.createElement("game-controller-container");
    this.UI.controllerContainer.setGame(this);
    document.body.appendChild(this.UI.controllerContainer);

    this.UI.pauseButton = document.createElement("pause-button");
    this.UI.controllerContainer.appendShadowChild(this.UI.pauseButton);

    this.UI.difficultyLabel = document.createElement("div");
    this.UI.difficultyLabel.style.cssText = [
      "position: fixed",
      "top: 0.9vmin",
      "left: 1.2vmin",
      "z-index: 12",
      "pointer-events: none",
      "font-family: monospace",
      "display: flex",
      "flex-direction: column",
      "gap: 0.2vmin",
      "color: #edf4ff",
      "letter-spacing: 0.03em",
      "text-shadow: 0 0 0.4vmin rgba(0, 0, 0, 0.75)",
      "user-select: none",
    ].join(";");

    this.UI.difficultyRow = document.createElement("div");
    this.UI.difficultyRow.style.cssText = [
      "display: flex",
      "align-items: baseline",
      "gap: 0.5vmin",
    ].join(";");

    this.UI.difficultyText = document.createElement("span");
    this.UI.difficultyText.textContent = "Nehézség:";
    this.UI.difficultyText.style.cssText = [
      "font-size: clamp(13px, 1.8vmin, 24px)",
      "font-weight: 700",
      "opacity: 0.95",
    ].join(";");

    this.UI.difficultyValue = document.createElement("span");
    this.UI.difficultyValue.style.cssText = [
      "font-size: clamp(15px, 2.2vmin, 30px)",
      "font-weight: 800",
      "min-width: 3ch",
      "display: inline-block",
    ].join(";");

    this.UI.scoreRow = document.createElement("div");
    this.UI.scoreRow.style.cssText = [
      "display: flex",
      "align-items: baseline",
      "gap: 0.5vmin",
      "margin-top: 0.15vmin",
    ].join(";");

    this.UI.scoreLabel = document.createElement("span");
    this.UI.scoreLabel.textContent = "Pontszám:";
    this.UI.scoreLabel.style.cssText = [
      "font-size: clamp(13px, 1.8vmin, 24px)",
      "font-weight: 700",
      "opacity: 0.95",
    ].join(";");

    this.UI.scoreValue = document.createElement("span");
    this.UI.scoreValue.style.cssText = [
      "font-size: clamp(15px, 2.2vmin, 30px)",
      "font-weight: 800",
      "transform-origin: left center",
      "min-width: 3ch",
      "display: inline-block",
    ].join(";");

    this.UI.difficultyRow.append(this.UI.difficultyText, this.UI.difficultyValue);
    this.UI.scoreRow.append(this.UI.scoreLabel, this.UI.scoreValue);
    this.UI.difficultyLabel.append(
      this.UI.difficultyRow,
      this.UI.scoreRow,
    );
    document.body.appendChild(this.UI.difficultyLabel);
  }

  exportSave() {
    this.game_id = this.game_id || crypto.randomUUID();

    return {
      game_id: this.game_id,
      seed: this.seed,
      player: this.player.exportSave(),
      enemies: this.enemies.exportSave(),
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

    this.saveType = "local";

    // frissítjük mert ha van akkor a <save-form> a <pause-menu>-n keresztül innen tölti be a nevet
    if (this.loadedSave) {
      this.loadedSave.save_name = saveName;
    }

    console.log("Game state has been saved locally as " + saveName);
    ToastManager.REQUEST(
      `Játékállás sikeresen mentve helyileg "${saveName}" néven`,
    );

    document.dispatchEvent(new CustomEvent("game-saved", { detail: { saveType: "local" } }));

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

    if (NetworkErrorHandler.handle(response, { context: "Game.remoteSave" })) {
      this.inSavingProcess = false;
      return false;
    }

    const saveName = formData.get("save_name");

    // frissítjük mert ha van akkor a <save-form> a <pause-menu>-n keresztül innen tölti be a nevet
    if (this.loadedSave) {
      this.loadedSave.save_name = saveName;
    }

    this.saveType = "remote";

    ToastManager.REQUEST(`Játékállás sikeresen feltöltve "${saveName}" néven`);

    document.dispatchEvent(new CustomEvent("game-saved", { detail: { saveType: "remote" } }));

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

    // set initial volume
    if (this.audioManager instanceof AudioManager) {
      const volume = Number(localStorage.getItem("game_volume") ?? 1);
      this.audioManager.setVolume(volume);
    }

    const gl = this.gl;
    const textureManager = this.textureManager;
    const audioManager = this.audioManager;

    const texturePromises = textureManager.promises ?? [];
    const audioPromise = audioManager?.whenAllLoaded?.() ?? Promise.resolve();

    // prettier-ignore
    Promise.all([...texturePromises, audioPromise]).then(
      () => {
        for (const { name, slot, offsetX, offsetY } of textureManager.textureCoordinateQueue) {
          textureManager.addTextureCoordinates(name, slot, offsetX, offsetY);
        }

        textureManager.loadFromActiveSlot();
        audioManager?.unlock?.();

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

        this.startBackgroundMusic();

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
    this.pauseBackgroundMusic();
    this.audioManager?.softStopAll?.();
    // this.audioManager?.stopAll?.();
    this.tooltip.disable();
    this.UI.pauseMenu?.show();
  }

  resume() {
    if (this.running) return;
    this.running = true;

    this.tooltip.enable();
    this.UI.pauseMenu.hide();

    this.last = window.performance.now();
    this.frameId = window.requestAnimationFrame(this.update);

    this.resumeBackgroundMusic();
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
    this.updateEnemySpawner();
    this.enemies.update();
    this.projectiles.update();
    this.buildingBlocks.update();
    this._tickBlockDestructionParticles();

    this.chunks.update();

    // prettier-ignore
    this.objects.merge(this.coreObjects, this.enemies, this.projectiles, this.buildingBlocks);
    this.grid.filter().iterate();

    if (!this.isFinished && this.player?.hasState(GlobalState.DEAD)) {
      this.triggerPlayerDeath();
    }

    this.updateDifficultyIndicator();

    this.tooltip.updateTemplates(this.frameId);
  }

  triggerPlayerDeath() {
    if (this.isFinished) return;
    this.isFinished = true;

    const KILL_RADIUS = 50;
    const PUSH_RADIUS = 80;
    const BURST_SPEED = 20;

    const px = this.player.position[0];
    const py = this.player.position[1];

    // Spawn a large explosion at the player's position
    this._spawnBlockDestructionParticles(14, px, py, 6);

    // Apply shockwave to all enemies
    for (const enemy of this.enemies.objects) {
      const dx = enemy.position[0] - px;
      const dy = enemy.position[1] - py;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.001) continue;

      const nx = dx / dist;
      const ny = dy / dist;

      // Kill enemies within the kill radius
      if (dist < KILL_RADIUS) {
        for (const block of enemy.model.objects) block.health = 0;
      }

      // Push enemies within the push radius
      if (dist < PUSH_RADIUS) {
        const falloff = 1 - dist / PUSH_RADIUS;
        const impulse = BURST_SPEED * falloff;
        enemy.velocity[0] += nx * impulse;
        enemy.velocity[1] += ny * impulse;
        enemy.maxSpeed = Math.max(enemy.maxSpeed, impulse);
      }
    }

    // Apply shockwave to all drifting building blocks (player's detached parts)
    for (const bb of this.buildingBlocks.objects) {
      const dx = bb.position[0] - px;
      const dy = bb.position[1] - py;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.001) continue;

      if (dist < PUSH_RADIUS) {
        const nx = dx / dist;
        const ny = dy / dist;
        const falloff = 1 - dist / PUSH_RADIUS;
        const impulse = BURST_SPEED * falloff;
        bb.velocity[0] += nx * impulse;
        bb.velocity[1] += ny * impulse;
        bb.maxSpeed = Math.max(bb.maxSpeed, impulse);
      }
    }

    // After a short delay, stop the game, show the death screen, and save
    setTimeout(() => {
      this.running = false;
      window.cancelAnimationFrame(this.frameId);
      this.audioManager?.stopAll?.();
      this.tooltip.disable();
      this.UI.deathScreen?.show();
      this.finishSave();
    }, 2500);
  }

  // prettier-ignore
  _spawnBlockDestructionAt(block, entity) {
    const cos = Math.cos(entity.rotation);
    const sin = Math.sin(entity.rotation);
    const lx = block.localPosition[0];
    const ly = block.localPosition[1];
    const wx = entity.position[0] + lx * cos - ly * sin;
    const wy = entity.position[1] + lx * sin + ly * cos;
    this._spawnBlockDestructionParticles(
      block.gradeID ?? 0,
      wx,
      wy,
      this.getBlockEffectScale(block),
    );
  }

  getBlockEffectScale(block) {
    const grade = Math.max(0, Math.min(14, block?.gradeID ?? 0));
    let scale = 0.8 + grade * 0.12;
    if (block?.isTurret) scale *= 0.5;
    return scale;
  }

  _spawnProjectileImpactAt(projectile, wx, wy, hitBlock = null) {
    const scale = Math.max(0.6, projectile?.impactScale ?? 1);
    const hitGrade = Math.max(0, Math.min(14, hitBlock?.gradeID ?? 0));
    const color = hitBlock
      ? (BlockStyle.GRADE_COLORS[hitGrade] ?? BlockStyle.GRADE_COLORS[0])
      : (projectile?.color ?? "rgba(220, 240, 255, 1)");
    const count = 3 + Math.floor(scale * 4);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.2 + Math.random() * 2.4) * (0.65 + scale * 0.35);
      const maxLife = (0.09 + Math.random() * 0.12) * (0.85 + scale * 0.2);
      this.blockDestructionParticles.push({
        x: wx,
        y: wy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: maxLife,
        maxLife,
        color,
        size: (0.08 + Math.random() * 0.12) * (0.8 + scale * 0.4),
      });
    }

    if (hitBlock) {
      this._spawnBlockDestructionParticles(
        hitBlock.gradeID ?? 0,
        wx,
        wy,
        this.getBlockEffectScale(hitBlock) * 0.35,
      );
    }
  }

  // prettier-ignore
  _spawnBlockDestructionParticles(gradeID, wx, wy, intensity = 1) {
    const color = BlockStyle.GRADE_COLORS[Math.max(0, Math.min(14, gradeID))] ?? BlockStyle.GRADE_COLORS[0];
    const count = Math.max(3, Math.round((5 + Math.random() * 4) * intensity));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.5 + Math.random() * 3.5) * (0.7 + intensity * 0.35);
      const maxLife = (0.25 + Math.random() * 0.3) * (0.8 + intensity * 0.18);
      this.blockDestructionParticles.push({
        x: wx, y: wy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: maxLife,
        maxLife,
        color,
        size: (0.25 + Math.random() * 0.35) * (0.75 + intensity * 0.3),
      });
    }
  }

  _tickBlockDestructionParticles() {
    const dt = this.fdt;
    let writeIndex = 0;
    for (const p of this.blockDestructionParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life > 0) this.blockDestructionParticles[writeIndex++] = p;
    }
    this.blockDestructionParticles.length = writeIndex;
  }

  // prettier-ignore
  renderBlockDestructionParticles(ctx, alpha) {
    if (!ctx || !this.player || this.blockDestructionParticles.length === 0) return;

    const W = this.canvas.width;
    const H = this.canvas.height;

    let scaleX = this.scale;
    let scaleY = this.scale;
    if (this.aspectRatio >= 1) scaleX = this.scale / this.aspectRatio;
    else scaleY = this.scale * this.aspectRatio;

    const ppuX = scaleX * W * 0.5;
    const ppuY = scaleY * H * 0.5;
    const camX = this.player.previousPosition[0] + (this.player.position[0] - this.player.previousPosition[0]) * alpha;
    const camY = this.player.previousPosition[1] + (this.player.position[1] - this.player.previousPosition[1]) * alpha;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const p of this.blockDestructionParticles) {
      const t = p.life / p.maxLife;
      const sx = (p.x - camX) * ppuX + W * 0.5;
      const sy = H * 0.5 - (p.y - camY) * ppuY;
      const radius = Math.max(1.5, p.size * ppuX);

      ctx.globalAlpha = t * 0.9;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
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
      this.player?.renderThrusterTrail?.(this.debugOverlay.ctx, this.alpha);
      for (const enemy of this.enemies.objects) {
        enemy?.renderThrusterTrail?.(this.debugOverlay.ctx, this.alpha);
      }
      this.renderBlockDestructionParticles(this.debugOverlay.ctx, this.alpha);
      if (this.showGridCells) {
        this.grid.debug();
      }
    }

    if (this.blockStyle) {
      this.blockStyle.clearCanvas();
    }
    
    // Drain a few queued decoration-block texture builds per frame so that
    // newly loaded chunks never cause a burst lag spike on the main thread.
    const TEXTURE_BUILDS_PER_FRAME = 3;
    for (let i = 0; i < TEXTURE_BUILDS_PER_FRAME && this._textureBuildQueue.length > 0; i++) {
      this._textureBuildQueue.shift()();
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
    this.player.model.onBlockDestroyed = (block) => this._spawnBlockDestructionAt(block, this.player);
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
   * @param {AudioManager} audioManager
   */
  addAudioManager(audioManager) {
    if (!(audioManager instanceof AudioManager)) {
      console.warn(
        "GAME-addAudioManager: Couldn't add audio manager: the given value is not an instance of the AudioManager class!",
      );
      return;
    }

    this.audioManager = audioManager;
  }

  setVolume(volume) {
    if (!(this.audioManager instanceof AudioManager)) {
      console.warn("GAME-setVolume: Unable to set game audio volume.");
      return;
    }

    this.audioManager.setVolume(volume);
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

  addController(controller, name = null) {
    const controllerName = name ?? controller.constructor.name;

    if (this.controllers.has(controllerName)) {
      console.warn(
        `GAME-addController: A controller with the name "${controllerName}" already exists and will be overwritten!`,
      );
    }

    if (typeof controller.setGame !== "function") {
      throw new Error(
        "GAME-addController: The given controller does not have a setGame method!",
      );
    }

    controller.setGame(this);
    this.controllers.set(controllerName, controller);

    if (controller instanceof HTMLElement) {
      if (!controller.isConnected && this.UI.controllerContainer) {
        this.UI.controllerContainer.appendShadowChild?.(controller);
      }
    }

    return controllerName;
  }
}
