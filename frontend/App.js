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
import Model from "./game/Model.js";
import { GlobalState } from "./game/State.js";
import Shape from "./game/Shape.js";
import Mouse from "./game/Mouse.js";
import BuildingBlock from "./game/BuildingBlock.js";

const game = new Game();
game.createCanvas();
game.initWebGL();
game.canvasToResponsiveFullWindow();
game.setProgram(Block.VERTEX_SHADER_SOURCE, Block.FRAGMENT_SHADER_SOURCE);
Block.INIT_RENDER(game);

const mouse = new Mouse(game);
game.coreObjects.add(mouse);
game.mouse = mouse;
mouse.enableListening();

const tm = new TextureManager(game);
game.addTextureManager(tm);

tm.queueTextureCoordinate(TextureID.HEART, TextureManager.S0, 0, 2);
tm.queueTextureCoordinate(TextureID.CANON, TextureManager.S0, 0, 1);
tm.queueTextureCoordinate(TextureID.BLOCK, TextureManager.S0, 0, 0);
tm.addTexture(TextureManager.S0, "./image/atlas.png", 1, 3);
tm.setActiveSlot(TextureManager.S0);

const sprite = new Sprite();
sprite.addFrame(TextureID.HEART, 2);
sprite.addFrame(TextureID.BLOCK, 2);
sprite.addFrame(TextureID.CANON, 2);

tm.addSprite(SpriteID.TEST, sprite);

// Collider structure: new Shape(can be merged with adjacent shapens, mergeMode, vertices: x1, y1, x2, y2, x3, y3, x4, y4)
// Merge Modes: AABB - only a square shape is possible - 4 vertices required
//              KEEP_ALL - no merging, all vertices are kept - opens room for complex shapes
// prettier-ignore
const rectCollider = new Shape(true, Shape.MERGE_MODE.AABB, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5);
// prettier-ignore
const triCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5);
// prettier-ignore
const turretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.2, 0.5, 0.2, 0.5, 0.5, -0.5, -0.5, -0.5); 
// prettier-ignore
const smallRectCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.15, 0.15, 0.15, 0.15, 0.15, -0.15, -0.15, -0.15);

const PLAYER_MODEL = [
  new Block(0, 0, rectCollider, SpriteID.TEST, 50),
  new Block(-1, 0, rectCollider, SpriteID.TEST, 50),
  new Block(1, 0, rectCollider, SpriteID.TEST, 50),
  new Block(0, 1, turretCollider, SpriteID.TEST, 50),
];

game.createPlayer(PLAYER_MODEL);
game.start();
// game.enablePointerLock();

// prettier-ignore
const ENEMY_MODEL = [
  new Block(0, 0, rectCollider, SpriteID.TEST),
  new Block(-1, 0, rectCollider, SpriteID.TEST),
  new Block(1, 0, rectCollider, SpriteID.TEST),
  new Block(0, 1, rectCollider, SpriteID.TEST)
];

const ENEMY_MODEL_2 = [
  new Block(0, 0, rectCollider, SpriteID.TEST),
  new Block(1, 0, rectCollider, SpriteID.TEST),
  new Block(-1, 0, rectCollider, SpriteID.TEST),
  new Block(2, 0, rectCollider, SpriteID.TEST),
  new Block(-2, 0, rectCollider, SpriteID.TEST),
  new Block(0, 1, rectCollider, SpriteID.TEST),
  new Block(1, 1, rectCollider, SpriteID.TEST),
  new Block(-1, 1, rectCollider, SpriteID.TEST),
  new Block(0, 2, triCollider, SpriteID.TEST),
];

const enemy = new Enemy({
  game,
  model: new Model(ENEMY_MODEL_2),
  x: 10,
  y: 10,
  maxSpeed: 10,
});

const bblock_1 = new BuildingBlock({
  game,
  model: new Model([new Block(0, 0, rectCollider, SpriteID.TEST)]),
  x: -5,
  y: -4,
});

game.enemies.add(bblock_1);

enemy.setState(GlobalState.DEAD);
console.log(enemy.hasState(GlobalState.DEAD));
enemy.clearState(GlobalState.DEAD);
console.log(enemy.hasState(GlobalState.DEAD));

game.enemies.add(enemy);

// Keyboard setup
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
