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

const game = new Game();
game.createCanvas();
game.initWebGL();
game.canvasToResponsiveFullWindow();
game.setProgram(Block.VERTEX_SHADER_SOURCE, Block.FRAGMENT_SHADER_SOURCE);
Block.INIT_RENDER(game);

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

game.createPlayer();
game.start();
game.enablePointerLock();

// prettier-ignore
const MODEL = [
  new Block(0, 0, SpriteID.TEST),
  new Block(-1, 0, SpriteID.TEST),
  new Block(1, 0, SpriteID.TEST),
  new Block(0, 1, SpriteID.TEST)
];

game.enemies.add(
  new Enemy({
    model: MODEL,
    x: 10,
    y: 10,
  })
);

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

game.setDebugPanel(debug);
game.startDebugging();
