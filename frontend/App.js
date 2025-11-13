import Game from "./game/Game.js";
import Block from "./game/Block.js";
import DebugMenu from "./game/DebugMenu.js";

const game = new Game();
game.createCanvas();
game.initWebGL();
game.canvasToResponsiveFullWindow();
game.setProgram(Block.VERTEX_SHADER_SOURCE, Block.FRAGMENT_SHADER_SOURCE);
Block.INIT_RENDER(game);
game.start();
game.enablePointerLock();

const debug = new DebugMenu();
debug.setSource(game);

debug.addElement("frames");
debug.bindSource("frames", "frames", (p) => (p.src.frames = 0));

debug.addElement("ticks");
debug.bindSource("ticks", "ticks", (p) => (p.src.ticks = 0));

game.setDebugMenu(debug);
game.startDebugging();
