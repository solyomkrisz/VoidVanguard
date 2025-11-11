import Game from "./game/Game.js";
import Block from "./game/Block.js";

const game = new Game();
game.createCanvas();
game.initWebGL();
game.canvasToResponsiveFullWindow();
game.setProgram(Block.VERTEX_SHADER_SOURCE, Block.FRAGMENT_SHADER_SOURCE);
Block.INIT_RENDER(game);
game.start();
game.enablePointerLock();

// prettier-ignore
setInterval(() => {
  console.log("Ticks: " + game.ticks + ", frames: " + game.frames + ", alpha: " + game.alpha);
  game.ticks = 0;
  game.frames = 0;
}, 1000);
