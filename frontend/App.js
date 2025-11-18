import Game from "./game/Game.js";
import Block from "./game/Block.js";
import Rigidbody from "./game/Rigidbody.js";
import DebugMenu from "./game/DebugMenu.js";
import Keyboard from "./game/Keyboard.js";
import TextureManager from "./game/TextureManager.js";
import Sprite from "./game/Sprite.js";
import { TextureID, SpriteID } from "./game/texture/Texture.js";

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

game.objects.push(
  new Rigidbody({
    model: MODEL,
    x: 3,
    y: 3,
  })
);

game.objects.push(
  new Rigidbody({
    model: MODEL,
    x: 5,
    y: 5,
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

const debug = new DebugMenu();
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

game.setDebugMenu(debug);
game.startDebugging();
