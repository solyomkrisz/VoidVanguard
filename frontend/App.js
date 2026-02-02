import Game from "./game/Game.js";
import Block from "./game/Block.js";
import Rigidbody from "./game/Rigidbody.js";
import DebugPanel from "./game/DebugPanel.js";
import Keyboard from "./game/Keyboard.js";
import TextureManager from "./game/TextureManager.js";
import Sprite from "./game/Sprite.js";
import { TextureID, SpriteID } from "./game/texture/Texture.js";
import Enemy from "./game/Enemy.js";
import DebugOverlay from "./game/DebugOverlay.js";
import BlockStyle from "./game/BlockStyle.js";
import Model from "./game/Model.js";
import { GlobalState } from "./game/State.js";
import Shape from "./game/Shape.js";
import Mouse from "./game/Mouse.js";
import BuildingBlock from "./game/BuildingBlock.js";
import Tooltip from "./ui/component/Tooltip.js";
import Models from "./game/SpaceShipModels.js";

const game = new Game();
game.createCanvas();
game.initWebGL();
game.canvasToResponsiveFullWindow();
game.setProgram(Block.VERTEX_SHADER_SOURCE, Block.FRAGMENT_SHADER_SOURCE);
Block.INIT_RENDER(game);

const ttipDebugTemplate = `
  -> parent |background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(20px); color: #fff; padding: 10px; border-radius: 8px;|/
  type/
  position/
  rotation/
  velocity/
  acceleration/
  forward/
  mass/
  netForce/
  netForceMagnitude/
  cells/
  proxyCollider/
  shapeCollider/
  ------
  -> block |background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(20px); color: #fff; padding: 10px; border-radius: 8px;|/
  localPosition/
  health/
  mass/
  isRemovable/
  spriteId/
  shape/
  `;

const ttip = new Tooltip();
ttip.reset = () => ttip.hide();
game.setTooltip(ttip);
ttip.createLayout("debug", ttipDebugTemplate);

const mouse = new Mouse(game);
game.coreObjects.add(mouse);
game.mouse = mouse;
mouse.enableListening();

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
  tm.queueTextureCoordinate(TextureID[`TURRET${i === 0 ? '' : i + 1}`], TextureManager.S0, i, 2);
}
tm.addTexture(TextureManager.S0, "./image/atlas.png", 15, 3);

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
  turretSprite.addFrame(TextureID[`TURRET${i === 1 ? '' : i}`], 2);
  tm.addSprite(SpriteID[`TURRET${i === 1 ? '' : i}`], turretSprite);
}

game.createPlayer(Models.PLAYER);
game.start();
// game.enablePointerLock();


const enemy = new Enemy({
  game,
  model: Models.SCOUT2,
  x: 10,
  y: 10,
  maxSpeed: 10,
});

enemy.setState(GlobalState.DEAD);
console.log(enemy.hasState(GlobalState.DEAD));
enemy.clearState(GlobalState.DEAD);
console.log(enemy.hasState(GlobalState.DEAD));

game.enemies.add(enemy);

const keyboard = new Keyboard(game);
game.keyboard = keyboard;
keyboard.observeKey(Keyboard.KeyW);
keyboard.observeKey(Keyboard.KeyS);
keyboard.observeKey(Keyboard.KeyA);
keyboard.observeKey(Keyboard.KeyD);
keyboard.observeKey(Keyboard.Space);
keyboard.enableListening();

const debugOverlay = new DebugOverlay();
game.setDebugOverlay(debugOverlay);
debugOverlay.init();

const blockStyle = new BlockStyle();
game.setBlockStyle(blockStyle);
blockStyle.init();

const debug = new DebugPanel();
debug.setSource(game);

debug.addElement("frames");
debug.bindSource("frames", "frames", (p) => (p.src.frames = 0));

debug.addElement("ticks");
debug.bindSource("ticks", "ticks", (p) => (p.src.ticks = 0));

debug.addElement("playerRotation");
debug.bindSource(
  "playerRotation",
  "playerRotation",
  (p) => (p.src.playerRotation = game.player.rotation)
);

debug.addElement("P XY");
debug.bindSource(
  "P XY",
  "playerPosition",
  (p) =>
    (p.src.playerPosition = [
      p.src.player.position[0].toFixed(4),
      p.src.player.position[1].toFixed(4),
    ])
);

debug.addElement("M XY");
debug.bindSource(
  "M XY",
  "mousePosition",
  (p) =>
    (p.src.mousePosition = [
      p.src.mouse.position[0].toFixed(4),
      p.src.mouse.position[1].toFixed(4),
    ])
);

game.setDebugPanel(debug);
game.startDebugging();
