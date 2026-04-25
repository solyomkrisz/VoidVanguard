import Block from "/game/Block.js";
import Mouse from "/game/Mouse.js";
import Keyboard from "/game/Keyboard.js";
import DebugOverlay from "/game/DebugOverlay.js";
import DebugPanel from "/game/DebugPanel.js";
import Models from "/game/SpaceShipModels.js";
import TextureManager from "/game/TextureManager.js";
import * as UI from "/ui/UI.js";
import Sprite from "/game/Sprite.js";
import { TextureID, SpriteID } from "/game/texture/Texture.js";
import "/ui/component/game/ContextMenuTemplate.js";
import EngineIgnitionController from "/ui/component/game/EngineIgnitionController.js";
import EngineThrottleController from "/ui/component/game/EngineThrottleController.js";
import ThrustVectorController from "/ui/component/game/ThrustVectorController.js";
import AudioManager from "/common/AudioManager.js";

export function setupGame(game, playerModel = Models.PLAYER) {
  if (game.running) return;

  //#region setup tooltip templates
  game.tooltip.createTemplate("PARENT_INFO", "ŰRHAJÓ", [
    ["Pozíció: ", "position"],
    ["Sebesség: ", "velocity"],
    ["Forgás: ", "rotation"],
    ["Össztömeg: ", "mass"],
    ["Tömegközéppont: ", "CoM"],
  ]);

  game.tooltip.createTemplate("BLOCK_INFO", "BLOKK", [
    ["Helyi pozíció: ", "localPosition"],
    ["Ütközőtest csúcsok: ", "shapeVertices"],
    ["Tömeg: ", "mass"],
    ["Eltávolítható: ", "isRemovable"],
    ["Életpontok: ", "health"],
    ["Tömegközéppont: ", "CoM"],
  ]);

  game.tooltip.createTemplate("THRUSTER_INFO", "HAJTÓMŰ", [
    ["Fajlagos impulzus: ", "Isp"],
    ["Tömegáram: ", "massFlowRate"],
    ["Van gimbal: ", "hasGimbal"],
    ["Gimbal: ", "_gimbal"],
    ["Throttle: ", "throttle"],
  ]);

  game.createCanvas(); // must be before createContextMenu
  game.createContextMenu();

  //#region initializing context menus
  const playerContextMenu = UI.element("context-menu-template");
  // prettier-ignore
  {
    playerContextMenu.addMenuItem("CW forgatás", "rotateCW", (src) => src.manualRotate(-1));
    playerContextMenu.addMenuItem("CCW forgatás", "rotateCCW", (src) => src.manualRotate());
  }
  game.contextMenu.addTemplate("PLAYER_CONTEXT_MENU", playerContextMenu);

  const enemyContextMenu = UI.element("context-menu-template");
  // prettier-ignore
  {
    enemyContextMenu.addMenuItem("Megöl", "kill", (src) => src.setState(GlobalState.DEAD));
  }
  game.contextMenu.addTemplate("ENEMY_CONTEXT_MENU", enemyContextMenu);

  //#region init webgl
  game.canvasToResponsiveFullWindow();
  game.initWebGL();
  game.setProgram(Block.VERTEX_SHADER_SOURCE, Block.FRAGMENT_SHADER_SOURCE);
  Block.INIT_RENDER(game);

  //#region mouse
  const mouse = new Mouse(game);
  game.coreObjects.add(mouse);
  game.mouse = mouse;
  mouse.enableListening();

  //#region keyboard or ignition controller
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (isTouch) {
    const ignitionController = document.createElement(
      "engine-ignition-controller",
    );
    game.addController(ignitionController);
    ignitionController.observeControl(EngineIgnitionController.IGNITE);

    const throttleController = document.createElement(
      "engine-throttle-controller",
    );
    game.addController(throttleController);
    throttleController.observeControl(EngineThrottleController.THROTTLE_UP);
    throttleController.observeControl(EngineThrottleController.THROTTLE_DOWN);

    const thrustVectorController = document.createElement(
      "thrust-vector-controller",
    );
    game.addController(thrustVectorController);
  } else {
    const keyboard = new Keyboard(game);
    game.keyboard = keyboard;
    keyboard.observeKey(Keyboard.KeyW);
    keyboard.observeKey(Keyboard.KeyS);
    keyboard.observeKey(Keyboard.KeyA);
    keyboard.observeKey(Keyboard.KeyD);
    keyboard.observeKey(Keyboard.Space);
    keyboard.observeKey(Keyboard.LCtrl);
    keyboard.observeKey(Keyboard.LShift);
    keyboard.observeKey(Keyboard.KeyR);
    keyboard.enableListening();
  }

  //#region audio
  // must be above the player because player accesses it inside its constructor
  const am = new AudioManager();
  game.addAudioManager(am);

  am.queueAudio("rocketengine", "/sound/rocketengine.mp3");

  game.createPlayer(playerModel); // Must be added after mouse or dragging wont work

  //#region debug
  const debugOverlay = new DebugOverlay();
  game.setDebugOverlay(debugOverlay);
  debugOverlay.init();

  const debug = new DebugPanel();
  debug.setSource(game);

  debug.addElement("frames");
  debug.bindSource("frames", "frames", (p) => (p.src.frames = 0));

  debug.addElement("ticks");
  debug.bindSource("ticks", "ticks", (p) => (p.src.ticks = 0));

  debug.addElement("seed");
  debug.bindSource("seed", "seed");

  debug.addElement("playerRotation", "12vmin");
  debug.bindSource(
    "playerRotation",
    "playerRotation",
    (p) => (p.src.playerRotation = game.player.rotation),
  );

  debug.addElement("P XY", "18vmin");
  debug.bindSource(
    "P XY",
    "playerPosition",
    (p) =>
      (p.src.playerPosition = [
        p.src.player.position[0].toFixed(4),
        p.src.player.position[1].toFixed(4),
      ]),
  );

  debug.addElement("M XY", "18vmin");
  debug.bindSource(
    "M XY",
    "mousePosition",
    (p) =>
      (p.src.mousePosition = [
        p.src.mouse.position[0].toFixed(4),
        p.src.mouse.position[1].toFixed(4),
      ]),
  );

  game.setDebugPanel(debug); // ?
  game.startDebugging(); // ?

  //#region texture
  const tm = new TextureManager(game);
  game.addTextureManager(tm);

  // Texture setup - 960x192 atlas (15 columns × 3 rows, 64x64 per texture)
  // Row 0: Block grades 0-14 with connector texture
  // Row 1: Block grades 0-14 without connector (unused for now) - reserved for dragging the blocks around, cause they look weird with connectors when not connected to anything
  // Row 2: Turret textures
  for (let i = 0; i < 15; i++) {
    tm.queueTextureCoordinate(TextureID[`BLOCK_${i}`], TextureManager.S0, i, 0);
  }
  // Queue turret textures from row 2 (all 15 columns)
  for (let i = 0; i < 15; i++) {
    tm.queueTextureCoordinate(
      TextureID[`TURRET${i === 0 ? "" : i + 1}`],
      TextureManager.S0,
      i,
      2,
    );
  }
  tm.addTexture(TextureManager.S0, "/image/atlas.png", 15, 3);

  // Wait for textures to load, then add coordinates and sprites
  tm.setActiveSlot(TextureManager.S0);

  // Create sprites for all 15 block grades
  for (let i = 0; i < 15; i++) {
    const blockGradeSprite = new Sprite();
    blockGradeSprite.addFrame(TextureID[`BLOCK_${i}`], 2);
    tm.addSprite(SpriteID[`BLOCK_${i}`], blockGradeSprite);
  }

  // Create sprites for all 15 turrets
  for (let i = 1; i <= 15; i++) {
    const turretSprite = new Sprite();
    turretSprite.addFrame(TextureID[`TURRET${i === 1 ? "" : i}`], 2);
    tm.addSprite(SpriteID[`TURRET${i === 1 ? "" : i}`], turretSprite);
  }
}
