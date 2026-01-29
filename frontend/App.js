import Game from "./game/Game.js";
import Block from "./game/Block.js";
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
import Thruster from "./game/Thruster.js";
import * as UI from "./ui/UI.js";
import _ from "./ui/component/ContextMenuTemplate.js";
import * as vec from "../frontend/common/vec.js";

const game = new Game();

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

game.createCanvas();
game.createContextMenu();

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

// prettier-ignore
const rectCollider = new Shape(true, Shape.MERGE_MODE.AABB, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5);
// prettier-ignore
const triCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5);
// prettier-ignore
const smallRectCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.15, 0.15, 0.15, 0.15, 0.15, -0.15, -0.15, -0.15);
// prettier-ignore
const turretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.2, 0.5, 0.2, 0.5, 0.5, -0.5, -0.5, -0.5);

const PLAYER_MODEL = [
  new Block({
    x: 0,
    y: 0,
    shape: rectCollider,
    spriteId: SpriteID.TEST,
    mass: 1,
  }),
  new Block({
    x: -1,
    y: 0,
    shape: rectCollider,
    spriteId: SpriteID.TEST,
    mass: 1,
  }),
  new Block({
    x: 1,
    y: 0,
    shape: rectCollider,
    spriteId: SpriteID.TEST,
    mass: 1,
  }),
  new Block({
    x: 0,
    y: 1,
    shape: rectCollider,
    spriteId: SpriteID.TEST,
    mass: 1,
  }),
  // new Block(-2, -1, rectCollider, SpriteID.TEST, 1),
  new Thruster({
    x: -1,
    y: -1,
    shape: rectCollider,
    spriteId: SpriteID.TEST,
    fuelType: 0,
    Isp: 400,
    massFlowRate: 600,
    hasGimbal: true,
    gimbalRange: 15,
  }),
  new Thruster({
    x: 1,
    y: -1,
    shape: rectCollider,
    spriteId: SpriteID.TEST,
    fuelType: 0,
    Isp: 400,
    massFlowRate: 600,
    hasGimbal: true,
    gimbalRange: 15,
  }),
];

game.createPlayer(PLAYER_MODEL);
game.start();
// game.enablePointerLock();

// prettier-ignore
const ENEMY_MODEL = [
  new Block({x:0, y:0, shape:rectCollider, spriteId:SpriteID.TEST}),
  new Block({x:-1,y: 0,shape: rectCollider,spriteId: SpriteID.TEST}),
  new Block({x:1, y:0, shape:rectCollider, spriteId:SpriteID.TEST}),
];

const ENEMY_MODEL_2 = [
  new Block({ x: 0, y: 0, shape: rectCollider, spriteId: SpriteID.TEST }),
  new Block({ x: 1, y: 0, shape: rectCollider, spriteId: SpriteID.TEST }),
  new Block({ x: -1, y: 0, shape: rectCollider, spriteId: SpriteID.TEST }),
  new Block({ x: 2, y: 0, shape: rectCollider, spriteId: SpriteID.TEST }),
  new Block({ x: -2, y: 0, shape: rectCollider, spriteId: SpriteID.TEST }),
  new Block({ x: 0, y: 1, shape: rectCollider, spriteId: SpriteID.TEST }),
  new Block({ x: 1, y: 1, shape: rectCollider, spriteId: SpriteID.TEST }),
  new Block({ x: -1, y: 1, shape: rectCollider, spriteId: SpriteID.TEST }),
  new Block({ x: 0, y: 2, shape: triCollider, spriteId: SpriteID.TEST }),
];

const enemy = new Enemy({
  game,
  model: new Model(ENEMY_MODEL),
  x: -23,
  y: -14,
  maxSpeed: 10,
});

const bblock_1 = new BuildingBlock({
  game,
  model: new Model([
    new Block({
      x: 0,
      y: 0,
      shape: rectCollider,
      spriteId: SpriteID.TEST,
      adjacencyRules: vec.fromValues(0, -1),
    }),
  ]),
  x: 0.5,
  y: 3,
});

// game.buildingBlocks.add(bblock_1);

enemy.setState(GlobalState.DEAD);
// console.log(enemy.hasState(GlobalState.DEAD));
enemy.clearState(GlobalState.DEAD);
// console.log(enemy.hasState(GlobalState.DEAD));

game.enemies.add(enemy);

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

debug.addElement("playerRotation");
debug.bindSource(
  "playerRotation",
  "playerRotation",
  (p) => (p.src.playerRotation = game.player.rotation),
);

debug.addElement("P XY");
debug.bindSource(
  "P XY",
  "playerPosition",
  (p) =>
    (p.src.playerPosition = [
      p.src.player.position[0].toFixed(4),
      p.src.player.position[1].toFixed(4),
    ]),
);

debug.addElement("M XY");
debug.bindSource(
  "M XY",
  "mousePosition",
  (p) =>
    (p.src.mousePosition = [
      p.src.mouse.position[0].toFixed(4),
      p.src.mouse.position[1].toFixed(4),
    ]),
);

game.setDebugPanel(debug);
game.startDebugging();
