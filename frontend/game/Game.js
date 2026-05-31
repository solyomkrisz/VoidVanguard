/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Game.js
 * Szerep: A teljes jatekkort osszefogo fo osztaly renderelessel, frissitessel es rendszerinditassal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
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

    const recoveredGameId = save?.game_id ?? parsed.game_id;
    const game = new Game(parsed.seed, recoveredGameId);
    game.loadedSave = save;
    const loadedSaveType = save?.save_type ?? save?.saveType;
    if (loadedSaveType === "local" || loadedSaveType === "remote") {
      game.saveType = loadedSaveType;
    }
    setupGame(game, new Model(Save.recoverModelObjects(parsed.player.model)));

    for (const enemy of parsed.enemies) {
      const recoveredEnemy = Save.recoverEntity(enemy, game);
      recoveredEnemy.model.applyTextureRotations(game.textureManager);
      game.enemies.add(recoveredEnemy);
    }

    game.player.score = parsed.player.score;
    const playerRotation = parsed.player.rotation ?? 0;
    game.player.rotation = playerRotation;
    game.player.teleportTo(...parsed.player.position);
    game.player.previousRotation = playerRotation;
    vec2.set(game.player.forward, 0, 1);
    vec2.rotate(game.player.forward, playerRotation);
    vec2.normalize(game.player.forward, game.player.forward);
    vec2.copy(game.player.previousForward, game.player.forward);
    game.player.onRotationChange();
    game.player.onPositionChange();

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

    /**
     * 1 / tileSize -> 1 NDC unit is tileSize world units
     * vagyis a teljes szélességbe 2 * tileSize kocka fér (mert NDC -1-től +1-ig megy)
     */
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

    // enemy spawnolással kapcsolatos dolgok
    this.enemySpawnerInitialized = false;
    this.enemySpawnInterval = 18;
    this.enemySpawnTimer = this.enemySpawnInterval; // timer a spawnoláshoz
    this.enemyInitialCount = 25;
    this.enemySpawnCellArea = 15;
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

  // Elinditja a hatterzenet, ha az audio reteg mar keszen all.
  startBackgroundMusic() {
    this.audioManager.getSound("backgroundmusic")?.instance?.start?.();
  }

  // Folytatja a korabban pauselt hatterzenet.
  resumeBackgroundMusic() {
    this.audioManager.getSound("backgroundmusic")?.instance?.resume?.();
  }

  // Szünetre teszi a hatterzenet a jatek allapotahoz igazodva.
  pauseBackgroundMusic() {
    this.audioManager.getSound("backgroundmusic")?.instance?.pause?.();
  }

  // Teljesen leallitja a hatterzenet.
  stopBackgroundMusic() {
    this.audioManager.getSound("backgroundmusic")?.instance?.stop?.();
  }

  // A kamera alap zoomjat a jatekos aktualis meretehez igazitja.
  getDefaultTileSize() {
    if ((this.player?.proxyCollider?.r ?? 0) > 14) {
      return this.player.proxyCollider.r;
    }

    return 14;
  }

  // Uj tile-meret beallitasa utan a vilag-skálat is frissiti.
  setTileSize(tileSize) {
    this.tileSize = tileSize;
    this.scale = 1 / this.tileSize;
  }

  // Atkapcsol normal jateknezet es builder-zoom kozott.
  toggleBuilderView() {
    if (this.inBuilderView) {
      this.setTileSize(this.getDefaultTileSize());
    } else {
      this.setTileSize(Math.ceil(this.player.proxyCollider.r + 3));
    }

    this.inBuilderView = !this.inBuilderView;
  }

  // Saját determinisztikus randomot ad az enemy-spawnhoz es archetipusokhoz.
  randomFloat() {
    this.enemyRngState =
      (Math.imul(this.enemyRngState, 1664525) + 1013904223) >>> 0;
    return this.enemyRngState / 4294967296;
  }

  // Egesz szamot valaszt a sajat random generatorral.
  randomInt(min, max) {
    return min + Math.floor(this.randomFloat() * (max - min + 1));
  }

  // A pontszam alapjan visszaadja az aktualis nehezsegi szintet.
  getCurrentDifficulty() {
    const score = this.player?.score ?? 0;
    // hátulról előrefele loopolunk a DIFFICULTY_SCORE_THRESHOLDS listában
    for (
      let difficulty = DIFFICULTY_SCORE_THRESHOLDS.length - 1;
      difficulty >= 0;
      difficulty--
    ) {
      // ha az adott item nagyobb vagy egyenlő mint a játékos scoreja visszaküldjük az indexet, egyébkét 0-ás indexet adunk
      if (score >= DIFFICULTY_SCORE_THRESHOLDS[difficulty]) return difficulty;
    }
    return 0;
  }

  // hány enemy lehet max
  // A nehezsegi szintbol egy fokozatosan novekvo enemy-limitet szamol.
  getEnemyCapByDifficulty(difficulty) {
    const d = Math.max(0, difficulty); // nehézségi szint indexe (min 0, max 15)
    const baselineMin = this.enemyInitialCount; // enemyInitialCount 25
    const baselineMax = this.enemyInitialCount + 30; // akkor így 55
    const normalized = Math.min(1, d / 15); // normalizáljuk a difficulty indexet

    /**
     * 0-ás nehézség esetén a min lesz,
     * maxos (15) nehézség esetén a max, vagyis 55
     */
    const scaledCap = baselineMin + normalized * (baselineMax - baselineMin);

    // egész számra kerekítjük a max enemy számot
    return Math.round(scaledCap);
  }

  // milyen gyakran spawnolhatnak enemyk
  // A nehezseggel csokkenti a spawnok kozti varakozasi idot.
  getEnemySpawnIntervalByDifficulty(difficulty) {
    const d = Math.max(0, difficulty);
    const maxInterval = 18;
    const minInterval = 6;
    const normalized = Math.min(1, d / 15);

    // elsőre furcsának tűnhet, hogy a max-hoz adunk hozzá, de a (minInterval - maxInterval) is fel van cseréve szóval az mínusz lesz, vagyis a + előtte - lesz szóval minden jó
    /**
     * difficulty 0: 18 a spawn interval
     * difficulty max (15): 6 a spawn interval
     * mindezek gondolom másodpercek
     */
    return maxInterval + (minInterval - maxInterval) * normalized;
  }

  // elem lüktetése
  // Egy rovid HUD-animacioval kiemeli a valtozott erteket.
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

  // tickenként meg van hívva
  // hudot updateli
  // Osszerakja es a HUD-ra kirajzolja az aktualis nehezseg- es pontszamjelzest.
  updateDifficultyIndicator() {
    const score = this.player?.score ?? 0;
    const difficulty = this.getCurrentDifficulty(); // jelenlegi nehézség indexe
    this.currentDifficulty = difficulty; // elmentjük Game példányra

    // ugyanazok a gradek vannak használva itt is színre mint eddig a trail és bullet colornak
    // ? 15-ös difficultyval mi van? valszeg GRADE_COLORS[0] lesz ami sima szürke gondolom
    const gradeIndex = Math.max(0, Math.min(14, difficulty - 1));
    const difficultyColor =
      BlockStyle.GRADE_COLORS[gradeIndex] || BlockStyle.GRADE_COLORS[0];

    // ha difficulty > 0 akkor ahányas a difficulty annyi teli csillag
    // ha difficulty 0 akkor egy üres csillag
    const stars = difficulty > 0 ? "★".repeat(difficulty) : "☆";
    // nőtt a score az itt elmentetthez képest?
    const scoreIncreased =
      this.lastDisplayedScore != null && score > this.lastDisplayedScore;

    // ha vannak html elemek
    if (
      this.UI.difficultyText &&
      this.UI.difficultyValue &&
      this.UI.scoreValue
    ) {
      this.UI.difficultyText.style.color = difficultyColor; //szín beállít
      this.UI.difficultyValue.textContent = stars; // difficulty jelölő csillagokat berak
      this.UI.difficultyValue.style.color = difficultyColor; // csillagok átszínezése
      this.UI.scoreValue.textContent = String(score); // score kiírása
      this.UI.scoreValue.style.color = "#f3f7ff"; // scorenak színadás

      // ha nőtt a score lüktetés animáció a html elemjére
      if (scoreIncreased) {
        this.pulseHudValue(this.UI.scoreValue);
      }
    }

    // score frissítése
    this.lastDisplayedScore = score;
  }

  /**
   * Difficulty 1–3 (easy):
   * -> 40% passive
   * -> 40% neutral
   * -> 20% aggressive
   *
   * Difficulty 4–9 (medium):
   * -> 18% rammer
   * -> 37% neutral
   * -> 45% aggressive
   *
   * Difficulty 10+ (hard):
   * -> 22% rammer
   * -> 20% neutral
   * -> 58% aggressive
   */
  // Random viselkedest valaszt a nehezsegi savnak megfelelo aranyokkal.
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

  // ugyan az mint a Player.setCurrentChunk
  // Kiszamolja, melyik hatterchunkban van a jatekos.
  getPlayerChunk() {
    const cx = Math.floor(
      this.player.position[0] / this.chunkSize / this.backgroundZoom,
    );
    const cy = Math.floor(
      this.player.position[1] / this.chunkSize / this.backgroundZoom,
    );
    return [cx, cy];
  }

  // melyik grid-ben van a játékos
  // ez a broad phase collision detection gridje
  // Visszaadja, melyik broad-phase racscellaban all a jatekos.
  getPlayerGridCell() {
    const cx = Math.floor(this.player.position[0] / this.grid.cellSize);
    const cy = Math.floor(this.player.position[1] / this.grid.cellSize);
    return [cx, cy];
  }

  // adott chunk látható e a játékos számára
  // Gyors lathatosagi teszt a render tavolsag alapjan.
  isChunkVisibleToPlayer(cx, cy) {
    const [pcx, pcy] = this.getPlayerChunk();
    const visX = this.renderDistance[0] + 1;
    const visY = this.renderDistance[1] + 1;
    return Math.abs(cx - pcx) <= visX && Math.abs(cy - pcy) <= visY;
  }

  // Megprobal egy uj enemy-t a jatekostol tavol, de meg ertelmes talalkozasi sugarban lespawnolni.
  trySpawnEnemy(difficulty) {
    if (!this.player) return false; // ha nincs player vissza

    // hány blokk méretű egy chunk
    // chunkSize alapból blokkonként van (ha 8, az 8x8)
    // de a bezoomolás hatással van nem csak a nebulára de a chunkokra is
    // szóval megszorozzuk itt is
    const chunkWorldSize = this.chunkSize * this.backgroundZoom;

    // látómezőn kívül spawnoljon az enemy
    const minSpawnDistance = Math.max(
      chunkWorldSize * 1.5,
      this.enemySpawnMinDistance,
    );

    // de túl messze ne mert soha nem találkozna a játékos vele
    const maxSpawnDistance = Math.max(
      minSpawnDistance + 10,
      this.enemySpawnMaxDistance,
    );

    const minSpawnSpacing = this.enemySpawnMinSpacing;

    // 80 próbálkozás van
    for (let attempt = 0; attempt < 80; attempt++) {
      const angle = this.randomFloat() * Math.PI * 2;

      // random spawn távolság a játékostól minSpawnDistance és maxSpawnDistance között
      const spawnDistance =
        minSpawnDistance +
        this.randomFloat() * (maxSpawnDistance - minSpawnDistance);

      // konkrétan hova spawnoljon
      // fent csak 1 távolságot generálunk (spawnDistance), és itt csinálunk belőlük koordinátákat
      const x = this.player.position[0] + Math.cos(angle) * spawnDistance;
      const y = this.player.position[1] + Math.sin(angle) * spawnDistance;

      const distanceToPlayer = spawnDistance;

      // ha közelebb van a spawnDistance a játékoshoz mint a minSpawnDistance vagy távolabb akkor az attemptet skippeljük
      // még nem látom hogy lehet közelebb vagy távolabb, ha this.randomFloat() 0 és 1 között ad értéket
      if (
        distanceToPlayer < minSpawnDistance ||
        distanceToPlayer > maxSpawnDistance
      )
        continue;

      // megnézzük túl közel van-e enemihez

      let tooCloseToEnemy = false;
      for (const enemy of this.enemies.objects) {
        if (
          Math.hypot(enemy.position[0] - x, enemy.position[1] - y) <
          minSpawnSpacing
        ) {
          // ha igen, loopot megszakítjuk
          tooCloseToEnemy = true;
          break;
        }
      }
      // és attemptet skippeljük
      if (tooCloseToEnemy) continue;

      // random viselkedés választása
      /**
       * lehetséges értékek: "passive", "neutral", "aggressive", "rammer"
       * DE!
       * "passive", "neutral", and "aggressive" all collapse into "AUTO" — they're completely thrown away
       *
       * Then pickArchetypeByDifficulty inside createEnemyModelByDifficulty re-picks the archetype from scratch when "AUTO" is passed.
       * This means pickEnemyBehavior only serves one purpose: deciding whether to force a RAMMER or not.
       */
      const behavior = this.pickEnemyBehavior(difficulty);

      // ! HOGY EZT MEGÉRTSÜK A SpaceShipModels.js/createEnemyModelByDifficulty, illetve egyéb
      // ! segédfüggvényeket is meg kell nézni

      const spawnArchetype = behavior === "rammer" ? "RAMMER" : "AUTO";

      // createEnemyModelByDifficulty - SpaceShipModels.js-ből jön
      /**
       * ha a behavior "rammer", akkor fixen azt spawnoltatunk, ha nem hagyjuk, hogy a függvény válassza ki ???
       */
      const enemyBlueprint = createEnemyModelByDifficulty(
        difficulty,
        spawnArchetype,
        () => this.randomFloat(),
      );
      /**
       * ez van enemyBlueprint-ben:
       * {
       *    archetype,
       *    model,
       *    maxSpeed,
       *    turnRate,
       * };
       */

      const enemy = new Enemy({
        game: this,
        model: enemyBlueprint.model,
        x,
        y,
        maxSpeed: enemyBlueprint.maxSpeed,
        turnRate: enemyBlueprint.turnRate, // milyen gyorsan tud forogni
        behavior,
        difficulty,
      });

      this.enemies.add(enemy);

      // elforgatjuk minden blokk textúráját, hogy egy szomszédjához csatlakozzon
      enemy.model.applyTextureRotations(this.textureManager);

      // ez lesz meghívva ha a modell egy blokkja meghal
      enemy.model.onBlockDestroyed = (block) =>
        this._spawnBlockDestructionAt(block, enemy);

      // ha le tudod spawnolni az enemy true-t adunk vissza
      /**
       * ez az egész azt jelenti, hogy egy adott enemy-t max 80-szor próbált meg lespawnolni a játék
       */
      return true;
    }

    return false;
  }

  // Az elso tickek egyikén feltolti a vilagot kezdo enemy-populacioval.
  initializeEnemySpawner() {
    if (this.enemySpawnerInitialized || !this.player) return;

    this.enemySpawnerInitialized = true;
    this.enemySpawnTimer = this.enemySpawnInterval;

    // ha már vannak enemyk ne spawnoljunk
    if (this.enemies.objects.length > 0) return;

    const difficulty = this.getCurrentDifficulty();

    // ha még nincsenek enemyk, próbáljuk meg annyit lespawnolni amennyi az enemyInitialCount
    for (let i = 0; i < this.enemyInitialCount; i++) {
      this.trySpawnEnemy(difficulty); // megpróbálunk enemyInitialCount db enemyt lespawnolni
    }
  }

  // tickenként meghívva
  // Folyamatosan egyensulyban tartja az enemy-populaciot a nehezseghez igazodo cap es timer szerint.
  updateEnemySpawner() {
    if (!this.player) return;

    if (!this.enemySpawnerInitialized) {
      this.initializeEnemySpawner();
    }

    const difficulty = this.getCurrentDifficulty();
    const spawnInterval = this.getEnemySpawnIntervalByDifficulty(difficulty); // milyen időközönként spawnolhat enemy
    const cap = this.getEnemyCapByDifficulty(difficulty); // hány enemy lehet max
    const deficit = cap - this.enemies.objects.length; // max enemy szán - mennyi van már spawnolódva

    // enemySpawnTimer - visszaszámláló a spawnoláshoz alapból értéke: enemySpawnInterval
    this.enemySpawnTimer = Math.min(this.enemySpawnTimer, spawnInterval);

    // Always count down so a free slot triggers a spawn without a full extra wait.
    this.enemySpawnTimer -= this.fdt; // timer csökkentése
    if (this.enemySpawnTimer > 0) return; // ha timer nagyobb mint 0 még nem járt le -> vissza

    // timer itt lejárt, de lent van annyi enemy amennyi max lehet
    if (deficit <= 0) {
      // Cap is full — reload the timer and wait for the next free slot.
      this.enemySpawnTimer = spawnInterval;
      return;
    }

    // Spawn a small batch so population recovers consistently even after bursts of deaths.
    /**
     * -> Math.ceil(deficit / 3): third of the deficit rounded up
     * -> Math.min(deficit, Math.ceil(deficit / 3)): caps it at deficit, but ceil(deficit/3) is always <= deficit, so this Math.min never does anything
     * -> Math.max(1, Math.min(deficit, Math.ceil(deficit / 3))): ensures that at least 1, but ceil(deficit/3) is already at least 1 whenever deficit > 0 (and we only get here if deficit > 0)
     *
     * ! this whole line below simplifies to: Math.ceil(deficit / 3)
     * So we target a batch of ceil(deficit/3)
     */
    const targetBatch = Math.max(1, Math.min(deficit, Math.ceil(deficit / 3)));
    let spawned = 0;
    let attempts = 0;
    const maxAttempts = Math.max(6, targetBatch * 8);

    // megpróbálunk annyit lespawnolni amennyi a target, addig amíg túl nem lépjük a max próbálkozásokat
    while (spawned < targetBatch && attempts < maxAttempts) {
      attempts++;
      if (this.trySpawnEnemy(difficulty)) {
        spawned++;
      }
    }

    // ha legalább 1 lett spawnolva
    // beállítva a spawnTimer-t az alapján hogy ment a fentebbi spawn
    if (spawned > 0) {
      /**
       * ha deficit > 1, vagyis a max és jelenleg létező enemyk különbsége > 1
       * akkor a timer Math.max(1.2, spawnInterval / Math.min(deficit, 5)) lesz
       *  -> spawnInterval / Math.min(deficit, 5) divide the normal wait time by deficit, capped at 5
       *  -> this means the more the deficit is (free enemy slots), the shorter the next timer is
       *  -> the cap with 5 prevents makes it so that the timer won't be extremely small when a lot of free slots are available
       * The whole true branch means that the more the free enemy slots, the faster their spawn will be, but never faster than 1.2s
       *
       * If deficit is <= 1 we use spawnInterval as timer. In this case the available enemy slot is at most 1, the population is basically full, so we just use the normal timer no need to rush
       */
      const catchUp =
        deficit > 1
          ? Math.max(1.2, spawnInterval / Math.min(deficit, 5))
          : spawnInterval;
      this.enemySpawnTimer = catchUp;
    } else {
      // ha nem sikerült spawnolni
      // semmi értelme a Math.min(2, spawnInterval), mert spawnInterval mindig legalább 6, tehát itt mindig 2 lesz beállítva
      this.enemySpawnTimer = Math.min(2, spawnInterval);
    }
  }

  // Halalkor befejezettnek jeloli a mentest, a helyi es tavoli utat kulon kezelve.
  async finishSave() {
    /**
     * kb az ami amugy volt csak tobb helyrol johet a saveType hogy biztosra menjunk
     */
    const localSaveKey = this.loadedSave?.game_id ?? this.game_id;
    const localSaves = getLocalSaves();

    let inferredSaveType =
      this.saveType ?? this.loadedSave?.save_type ?? this.loadedSave?.saveType;

    if (!inferredSaveType && localSaves.has(localSaveKey)) {
      inferredSaveType = "local";
    }

    if (inferredSaveType === "local" || inferredSaveType === "remote") {
      this.saveType = inferredSaveType;
    }

    // Játék befejezése ha nem volt mentve
    if (!["local", "remote"].includes(this.saveType)) {
      ToastManager.REQUEST(
        "A játékot nem lehet befejezne: ismeretlen mentéstípus",
      );
      return;
    }

    // Ha mentve volt
    if (this.saveType === "local") {
      const existingSave =
        localSaves.get(localSaveKey) ?? this.loadedSave ?? {};
      const completedSave = {
        ...existingSave,
        ...this.loadedSave,
        game_id: localSaveKey,
        save_name:
          existingSave.save_name ??
          this.loadedSave?.save_name ??
          "Unnamed Save",
        game_state: this.exportSave(),
        is_finished: 1,
        created_at:
          existingSave.created_at ?? this.loadedSave?.created_at ?? Date.now(),
        updated_at: Date.now(),
        save_type: "local",
      };

      localSaves.set(localSaveKey, completedSave);

      if (this.game_id !== localSaveKey) {
        localSaves.delete(this.game_id);
      }

      this.loadedSave = completedSave;

      localStorage.setItem("localSaves", JSON.stringify([...localSaves]));

      document.dispatchEvent(
        new CustomEvent("game-saved", { detail: { saveType: "local" } }),
      );

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
    document.dispatchEvent(
      new CustomEvent("game-saved", { detail: { saveType: "remote" } }),
    );

    // kiléptetés vagy endscreen mutatása
  }

  // Leallitja a jatekot, lebontja a hozza tartozo UI-t es kiszedi a sajat DOM-elemeket.
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
  // csak ui építése
  // A jatekhoz szukseges globalis UI-elemeket hozza letre es fuzni a DOM-ba.
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

  // A teljes jatek jelenlegi mentheto allapotat sima objektumma alakitja.
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

  // Helyileg elmenti a jatekallast localStorage-be.
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

    document.dispatchEvent(
      new CustomEvent("game-saved", { detail: { saveType: "local" } }),
    );

    this.inSavingProcess = false;

    return true;
  }

  // A szerverre kuldi fel vagy frissiti a tavoli jatekmentest.
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

    document.dispatchEvent(
      new CustomEvent("game-saved", { detail: { saveType: "remote" } }),
    );

    this.inSavingProcess = false;

    return true;
  }

  // A save_type alapjan kivalasztja, hogy helyi vagy tavoli mentes fusson.
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
  /**
   * TEXTURE_2D_ARRAY -> 2d texture array -> many same sized 2d texture packed into the same gpu texture object
   * - all layers have the same width and height and format
   */
  initTextureArray() {
    const gl = this.gl;

    this.textureArray = gl.createTexture(); // create texture object
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.textureArray); // bind so all later operations work on this texture object, so all upcoming operations involving gl.TEXTURE_2D_ARRAY will affect this texture

    // allocate immutable storage
    // ! texStorage3D only allocates memory, it does not upload anything
    gl.texStorage3D(
      gl.TEXTURE_2D_ARRAY, // target
      1, // levels (mipmap levels) - since its one only the base texture exists, no smaller versions
      gl.RGBA8, // internal format - 8 bit for each of R, G, B and A
      DecorationBlock.TEXTURE_WIDTH, // width - width of each layer
      DecorationBlock.TEXTURE_HEIGHT, // height - height of each layer
      this.maxLayers, // depth - number of layers
    );

    // number of items is the result of the operation inside its ()
    // its automatically initialied with zeros, so all items are zeros
    const initialTexture = new Uint8Array(
      DecorationBlock.TEXTURE_WIDTH *
      DecorationBlock.TEXTURE_HEIGHT *
      4 *
      this.maxLayers,
    );
    //
    // upload texture data
    // this command fills the gpu texture with the cpu data we made above this
    gl.texSubImage3D(
      gl.TEXTURE_2D_ARRAY, // target
      0, // level - mip level to write into, since above we specified, there is only one, it must be the first one, which is 0
      0, 0, 0, // xoffset, yoffset, zoffset - this means start at left edge, top edge, first layer. zoffset select the layer to start writing from, x and y offsets are inside that layer
      // the sizes below mean that the whole array gets filled
      DecorationBlock.TEXTURE_WIDTH, // width
      DecorationBlock.TEXTURE_HEIGHT, // height
      this.maxLayers, // depth
      gl.RGBA, // format - desrcibes the layout of incoming pixel data
      gl.UNSIGNED_BYTE, // type - each channel is an 8 bit unsigned integer (0-255, as in normal RGBA)
      initialTexture, // data - pointer/reference to the cpu pixel data
    );
    //

    /**
     * S - horizontal axis
     * if texture coordinate points outside of range, clamp to edge
     */
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    /**
     * same as above but for vertical axis
     */
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);

    this.lastLayer = 0;

    /**
     * ! RGBA vs RGBA8
     * RGBA8 defines how the GPU stores pixels internally
     * RGBA defines how my incoming pixel data is arranged
     * 
     * You might have noticed that as internal format we did use RGBA earlier.
     * If you go back you see that we used that with gl.texImage2D.
     * And there is no problem with that. gl.texImage2D is and older API which could be
     * used with RGBA. RGBA is an unsized internal format, it does not specify a bunch of thing
     * unlike RGBA8.
     * Model WebGL API prefers RGBA8 as it is explicit.
     * 
     ** texStorage2D / texStorage3D:
     * These newer immutable-storage APIs REQUIRE sized formats.
     * because immutable storage needs exact memory layout up front.
     * 
     ** Why immutable storage requires sized formats:
     * texStorage* allocates the entire texture permanently.
     * GPU must know EXACTLY:
     * - bytes per pixel
     * - mip sizes
     * - memory layout
     * before allocation.
     * So ambiguity is not allowed.
     * 
     ** In contrast, texImage* is older and more flexible
     * texImage* historically allowed:
     * - reallocating textures
     * - changing formats later
     * - driver-selected formats
     * So unsized formats were tolerated.
     * 
     */
  }

  bindTextureArray() {
    const gl = this.gl;

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.textureArray);
    gl.uniform1i(this.uniform.textureArray, 1);
  }

  // A teljes jatek inditasa: eroforrasokra var, GPU-texturakat bindol, majd elinditja a frame loopot.
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

  // Szünetelteti a jatekot es a kapcsolodo audio/UI allapotot.
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

  // Folytatja a frame loopot es visszakapcsolja a jatek kozbeni UI-t/audio-t.
  resume() {
    if (this.running) return;
    this.running = true;

    this.tooltip.enable();
    this.UI.pauseMenu.hide();

    this.last = window.performance.now();
    this.frameId = window.requestAnimationFrame(this.update);

    this.resumeBackgroundMusic();
  }

  // A vizualis frame loop: idot mer, tickeket ledolgoz, majd renderel.
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

  // Egy fix idolepesnyi jatekszimulaciot futtat le: input, AI, fizika, utkozes, UI.
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

    const playerHasLiveCore = this.player?.model?.objects?.some(
      (block) =>
        block && !block.isRemovable && !block.toRemove && block.health > 0,
    );

    // ha játék még megy, van player de nincs magja, megölni a játékost
    if (!this.isFinished && this.player && !playerHasLiveCore) {
      this.player.setState(GlobalState.DEAD);
    }

    // ha a játék még nincs finishelve, de a játékos halott
    // playerDeath-et triggerelni
    if (!this.isFinished && this.player?.hasState(GlobalState.DEAD)) {
      this.triggerPlayerDeath();
    }

    this.updateDifficultyIndicator();

    this.tooltip.updateTemplates(this.frameId);
  }

  // A halalesemeny teljes kovetkezmenylancat elinditja: endscreen, finishSave, robbanas, shockwave.
  triggerPlayerDeath() {
    if (this.isFinished) return; // ha játék már be van fejezve vissza
    this.isFinished = true; // játékos meghalt, szóval isFinished true-ra
    this.UI.deathScreen?.show(); // mutatjuk az endscreent
    this.finishSave(); // elmentjük a játékot, megjelöljük finished-ként

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

      // enemy távja a játékostól
      const dist = Math.hypot(dx, dy);

      // ha nagyon közel van akkor kövi enemy-re
      if (dist < 0.001) continue;

      // normalizált x, y, vagyis csak irány, ami a játékostól az enemy felé mutat
      const nx = dx / dist;
      const ny = dy / dist;

      // Kill enemies within the kill radius
      // érdekes módon, de az összes enemy-t a radiusban megöljük
      if (dist < KILL_RADIUS) {
        for (const block of enemy.model.objects) block.health = 0;
      }

      // Push enemies within the push radius
      if (dist < PUSH_RADIUS) {
        /**
         * linear falloff
         * enemies right at the center get a falloff of 1.0 (1 - ~0.2 / 80)
         * enemies at the edge get 0.0 (1 - 80/80)
         */
        const falloff = 1 - dist / PUSH_RADIUS;

        // scales the speed by how close the enemy is
        const impulse = BURST_SPEED * falloff;

        // in the given direction (from player toward enemy), apply impulse
        // this will make it look like the shockwave comes from the player
        enemy.velocity[0] += nx * impulse;
        enemy.velocity[1] += ny * impulse;

        // maxSpeed átállítása, hogy ha a jelenleginél gyorsabb az impulse akkor látszódjon hogy rá lett rakva az enemy-re
        enemy.maxSpeed = Math.max(enemy.maxSpeed, impulse);
      }
    }

    // Apply shockwave to all drifting building blocks (player's detached parts)
    for (const bb of this.buildingBlocks.objects) {
      const dx = bb.position[0] - px;
      const dy = bb.position[1] - py;

      // táv játékostól a buildingblokhoz
      const dist = Math.hypot(dx, dy);

      // ha közel van ennyire, skip
      if (dist < 0.001) continue;

      // ha push radiuson belül van
      if (dist < PUSH_RADIUS) {
        // normalizált x, y, vagyis a játékostól a building block felé mutató irány
        const nx = dx / dist;
        const ny = dy / dist;

        /**
         * ! ugyan az mint az enemy-k esetében feljebb
         */
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
    }, 2500);
  }

  // prettier-ignore
  /**
   * segédfüggvény hogy adott blokkhoz pusztulási effektet spawnoljunk
   */
  _spawnBlockDestructionAt(block, entity) {
    const cos = Math.cos(entity.rotation);
    const sin = Math.sin(entity.rotation);

    const lx = block.localPosition[0];
    const ly = block.localPosition[1];

    // a blokk lokális pozícióját world pozícióvá konvertáljuk (forgatás + eltolás)
    const wx = entity.position[0] + lx * cos - ly * sin;
    const wy = entity.position[1] + lx * sin + ly * cos;
    
    // legeneráltatjuk a particle-t
    this._spawnBlockDestructionParticles(
      block.gradeID ?? 0,
      wx,
      wy,
      this.getBlockEffectScale(block),
    );
  }

  /**
   * intensity érték generálása a _spawnBlockDestructionParticles függvényhez
   */
  getBlockEffectScale(block) {
    const grade = Math.max(0, Math.min(14, block?.gradeID ?? 0)); // blokk gradeID-je // min 0, max 14

    /**
     * scale érték számítása
     * - min 0.8, max 2,48 (ha gradeID 14)
     * - minél nagyobb a gradeID annál nagyobb a scale
     */
    let scale = 0.8 + grade * 0.12;

    // ha a blokk turret az előbb kiszámított scale értéket megfelezzük
    // turret robbanása kevésbé intenzív
    if (block?.isTurret) scale *= 0.5;

    return scale;
  }

  /**
   * Feladata:
   * The function does two things:
   * 1. Impact spark — always spawned at (wx, wy), using the projectile's color.
   * This is the small flash showing where the projectile hit.
   * 2. Block damage particles — only if hitBlock is provided, spawned at the same
   * position but using the block's grade color and getBlockEffectScale(hitBlock) * 0.35
   * as intensity. The * 0.35 keeps them subtle — just a hint that the block took damage,
   * not a full destruction burst.
   */
  _spawnProjectileImpactAt(projectile, wx, wy, hitBlock = null) {
    // minimum scale 0.6, szóval a gyenge lövedékek is látható becsapódást okoznak
    const scale = Math.max(0.6, projectile?.impactScale ?? 1);

    // gradeID amit eddig is mindenhol használtunk, ha nincs meg milyen blokkot érintett, akkor 0
    const hitGrade = Math.max(0, Math.min(14, hitBlock?.gradeID ?? 0));

    const color = hitBlock
      ? (BlockStyle.GRADE_COLORS[hitGrade] ?? BlockStyle.GRADE_COLORS[0])
      : (projectile?.color ?? "rgba(220, 240, 255, 1)");

    // minimum 3 particle, ha scale 1, akkor 7 particle
    // erősebb projectile-ok több particle-t spawnolnak
    const count = 3 + Math.floor(scale * 4);

    // loop amennyi a count
    //! kb ugyan az mint a _spawnBlockDestructionParticles loopjában, max más értékek
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2; // random irány 0 és 360 fok között, ebbe az irányba fog repülni a particle

      /**
       * speed érték számítása
       * -> (1.2 + Math.random() * 2.4) -> min 1.2, max 3.6
       * -> scale factor: (0.65 + scale * 0.35) -> min 0.65, de scale min 0.6, szóval valójában
       *    min 0.86
       *    - ha scale 1, akkor ez 1 lesz
       *
       * erősebb projectile-ok particle-jei gyorsabbak
       */
      const speed = (1.2 + Math.random() * 2.4) * (0.65 + scale * 0.35);

      /**
       * maxLife számítása
       * -> (0.09 + Math.random() * 0.12) -> min 0.09, max 0.21 másodperc
       * -> (0.85 + scale * 0.2) -> min 0.85, de mivel scale legalább 0.6 ezért az igazi min 0.97
       *    - ha scale 1, akkor ez 1.05
       *
       * erősebb becsapódások particle-jei kissé több ideig tartanak
       */
      const maxLife = (0.09 + Math.random() * 0.12) * (0.85 + scale * 0.2);

      this.blockDestructionParticles.push({
        x: wx,
        y: wy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: maxLife,
        maxLife,
        color,
        /**
         * size érték kiszámolása
         * -> (0.08 + Math.random() * 0.12) -> min 0.08, max 0.20
         * -> (0.8 + scale * 0.4) -> min 0.8, de scale min 0.6 szóval valódi min 1.04
         *    - ha scale 1, akkor ez 1.2
         *
         * erősebb becsapódások nagyobb particle-öket eredményeznek
         */
        size: (0.08 + Math.random() * 0.12) * (0.8 + scale * 0.4),
      });
    }

    // ha van hit block akkor oda spawnoulnk "sebződés" particle-öket
    if (hitBlock) {
      this._spawnBlockDestructionParticles(
        hitBlock.gradeID ?? 0,
        wx,
        wy,
        /**
         * itt le van scaleelve az intensity ami szintén megerősíti, hogy ez csak sebződés particle
         * ha a blokk meghal, akkor máshol is meg van hívva ez a függvény a 0.35-ös szorzó nélkül
         * az a teljes "meghalás robbanás" effekt
         */
        this.getBlockEffectScale(hitBlock) * 0.35,
      );
    }
  }

  // prettier-ignore
  /**
   *
   * @param {*} gradeID - a színhez (a blokk pusztulás effekt szín a block típusától függ)
   * @param {*} wx - world x ???
   * @param {*} wy - world y ???
   * @param {*} intensity
   */
  _spawnBlockDestructionParticles(gradeID, wx, wy, intensity = 1) {
    const color = BlockStyle.GRADE_COLORS[Math.max(0, Math.min(14, gradeID))] ?? BlockStyle.GRADE_COLORS[0];
    /**
     * count kiszámítása
     * -> Math.random() * 4 -> random szám 0 és 4 között
     * -> 5 + Math.random() * 4 -> particle-ök most min 5, max 9 lehet
     * -> (5 + Math.random() * 4) * intensity) -> magasabb intensity több, alacsonyabb kevesebb
     * -> Math.round((5 + Math.random() * 4) * intensity) -> egész számra kerekítjük, mert a random * 4 és az intensity nem biztos hogy egész szám
     * -> Math.max 3 miatt legalább 3 mindig lesz spawnolva, még akkor is ha intensity-t levesszük 0-ra
     */
    const count = Math.max(3, Math.round((5 + Math.random() * 4) * intensity));

    // loop ahány a count
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2; // random szög 0 és 2pi radián között (0 és 360 fok)
      
      /**
       * speed kiszámolása
       * -> Math.random() * 3.5 -> min 0, max 3,5
       * -> (1.5 + Math.random() * 3.5) -> min 1.5, max 5
       * -> alapból vagyis min 1.5 max 5 a speed
       * -> (0.7 + intensity * 0.35)
       *    - intensity = 0, akkor 0.7-el szorzunk
       *    - intensity = 1, akkor 1.05-el szorzunk (kb változatlan)
       *    - magasabb intensity (>1) által gyorsabb lesz a speed
       */
      const speed = (1.5 + Math.random() * 3.5) * (0.7 + intensity * 0.35);

      /**
       * maxLife kiszámítása
       * -> Math.random() * 0.3 -> min 0, max 0.3
       * -> (0.25 + Math.random() * 0.3) -> min 0.25, max 0.55
       * -> alapból vagyis min 0.25, max 0.55 a maxLife
       * -> (0.8 + intensity * 0.18)
       *    - minimum 0.8-al szorozzuk az előző értéket
       *    - ha intensity = 0, akkor 0.8-al szorunk
       *    - ha intensity = 1, akkor 0.98-al szorzunk (kb változatlan)
       *    - ha intensity > 1, akkor a particle-ök kicsit több ideig élnek, de elhanyagolható 
       */
      const maxLife = (0.25 + Math.random() * 0.3) * (0.8 + intensity * 0.18);
      
      /**
       * listába rakjuk a particle-öket, amit később
       * a renderBlockDestructionParticles függvény renderel
       */
      this.blockDestructionParticles.push({
        x: wx, y: wy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: maxLife,
        maxLife,
        color,
        /**
         * size kiszámítása
         * -> (0.25 + Math.random() * 0.35) -> min 0.25, max 0.6
         * -> (0.75 + intensity * 0.3)
         *    - ha intensity 0, akkor 0.75-el szorzunk
         *    - ha intensity 1, akkor 1.05-el szorzunk
         *    - ha intensity >1, akkor nagyobban a particle-ök
         */
        size: (0.25 + Math.random() * 0.35) * (0.75 + intensity * 0.3),
      });
    }
  }

  /**
   * updateli a blockDestructionParticle-öket
   * - változtatja a pozíciójukat, sebességük alapján
   * - updateli az életciklusukat, és ha lejárt az idejük nem rakja fel a listára őket, vagyis megöli
   */
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
  /**
   * köröket renderel mint blockDestructionParticle
   */
  renderBlockDestructionParticles(ctx, alpha) {
    if (!ctx || !this.player || this.blockDestructionParticles.length === 0) return;

    const W = this.canvas.width;
    const H = this.canvas.height;

    // ugyanazt kiszámítjuk mint a mat3.js/cam függvényben
    let scaleX = this.scale;
    let scaleY = this.scale;
    if (this.aspectRatio >= 1) scaleX = this.scale / this.aspectRatio;
    else scaleY = this.scale * this.aspectRatio;

    const ppuX = scaleX * W * 0.5;
    const ppuY = scaleY * H * 0.5;
    const camX = this.player.previousPosition[0] + (this.player.position[0] - this.player.previousPosition[0]) * alpha;
    const camY = this.player.previousPosition[1] + (this.player.position[1] - this.player.previousPosition[1]) * alpha;

    ctx.save();

    /**
     * szabályozza hogy az új pixelek hogy lesznek a már meglévőre rajzolva
     * alapértelmezett érték a "source-over"
     * "lighter" - "uses additive blending: the RGB values of the new pixel and the existing pixel are simply added together."
     * 
     * pl.:
     * - Existing pixel: rgb(100, 50, 0) (dark orange)
     * - New pixel: rgb(80, 30, 0) (another dark orange)
     * - Result: rgb(180, 80, 0) (brighter orange)
     */
    ctx.globalCompositeOperation = "lighter";

    // loop végig az összes particle-n
    for (const p of this.blockDestructionParticles) {
      const t = p.life / p.maxLife; // 0 és 1 közötti érték, kezdetben 1, majd ahogy több ideje él (p.life csökkentésre kerül) 0-hoz tart
      
      /** kör középpontja canvas koordinátákban */
      const sx = (p.x - camX) * ppuX + W * 0.5;
      const sy = H * 0.5 - (p.y - camY) * ppuY;

      /** radius reszponzívan */
      const radius = Math.max(1.5, p.size * ppuX);

      ctx.globalAlpha = t * 0.9; // alpha max 0.9
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2); // teljes kör rajzolása
      ctx.fill();
    }

    ctx.globalAlpha = 1; // alpha vissza 1-re
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

    /**
     * px és py interpolált player pozíció
     */
    const px = ppx + (pcx - ppx) * this.alpha;
    const py = ppy + (pcy - ppy) * this.alpha;

    // mat3.cam scale calculation - therefor grid always matches the camera
    let scaleX = this.scale, scaleY = this.scale;
    if (this.aspectRatio >= 1) scaleX = this.scale / this.aspectRatio;
    else                       scaleY = this.scale * this.aspectRatio;

    const ppuX = scaleX * W / 2;
    const ppuY = scaleY * H / 2;

    // halfW = W / (2 * scaleX * W * 0.5) -> halfW = 1 / scaleX

    /**
     * tileSize az hogy mennyi tile látható középről az egyik szél felé, vagyis a teljes szélesség 2 * tileSize
     * scale = 1 / tileSize
     * doing 1 / scale (either scaleX or scaleY stays scale because both sides of if...else cannot run)
     * just turns it back into tileSize
     */

    // ez rakás szar, csak félrevezető, egy halom dolog kiegyszerűsödik ha kibontjuk a kifejezéseket
    const halfW = W / (2 * ppuX); // halfW = 1 / scaleX - half width of the visible world, in world units
    const halfH = H / (2 * ppuY); // halfH = 1 / scaleY - half height ...

    /**
     * px - halfW -> a kijelző bal széle world coordinátákban
     * azzal hogy leosztjuk gridSize-zal és floorolunk a legközelebbi grid vonalhoz spaneli bal oldalon
     * 
     * (px - halfW) / gridSize -> how many grid cells that position is from the player's position, that would be without dividing by gridSize
     *                          we divide by grid Size, so we get which grid cell that position falls into relative from the world center
     * floor it so we snap it down to a whole number of grid cells, ensuring we don't miss the leftmost visible line
     * multiply that by gridSize and you convert it back to world coordinates (in block units)
     * 
     * y0 is the same but for the y axis
     */
    const x0 = Math.floor((px - halfW) / gridSize) * gridSize;
    const y0 = Math.floor((py - halfH) / gridSize) * gridSize;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    // vertikális vonalak rajzolása
    for (let wx = x0; wx <= px + halfW + gridSize; wx += gridSize) {
      const sx = (wx - px) * ppuX + W / 2;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, H);
    }

    // horizontális vonalak rajzolása
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
      this._textureBuildQueue.shift()(); // ?
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

  //#region setterek csak

  createPlayer(model) {
    if (!(model instanceof Model)) {
      throw new Error(
        "Unable to create player: the provided argument is not a Model",
      );
    }

    this.player = new Player(this, model);
    this.coreObjects.add(this.player);
    this.player.model.onBlockDestroyed = (block) =>
      this._spawnBlockDestructionAt(block, this.player);
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
