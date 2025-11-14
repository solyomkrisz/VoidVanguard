import Game from "./game/Game.js";
import Block from "./game/Block.js";
import Rigidbody from "./game/Rigidbody.js";

const game = new Game();
game.createCanvas();
game.initWebGL();
game.canvasToResponsiveFullWindow();
game.setProgram(Block.VERTEX_SHADER_SOURCE, Block.FRAGMENT_SHADER_SOURCE);
Block.INIT_RENDER(game);
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
    x: 0,
    y: 0,
  })
);

game.objects.push(
  new Rigidbody({
    model: MODEL,
    x: 5,
    y: 5,
  })
);

// prettier-ignore
setInterval(() => {
  console.log("Ticks: " + game.ticks + ", frames: " + game.frames + ", alpha: " + game.alpha);
  game.ticks = 0;
  game.frames = 0;
}, 1000);
