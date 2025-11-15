import Game from "./game/Game.js";
import Block from "./game/Block.js";
import Rigidbody from "./game/Rigidbody.js";
import DebugMenu from "./game/DebugMenu.js";
import Keyboard from "./game/Keyboard.js";

const game = new Game();
game.createCanvas();
game.initWebGL();
game.canvasToResponsiveFullWindow();
game.setProgram(Block.VERTEX_SHADER_SOURCE, Block.FRAGMENT_SHADER_SOURCE);
Block.INIT_RENDER(game);
game.createPlayer();
game.start();
game.enablePointerLock();

// prettier-ignore
const MODEL = [
  new Block(0, 0),
  new Block(-1, 0),
  new Block(1, 0),
  new Block(0, 1)
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

game.setDebugMenu(debug);
game.startDebugging();
