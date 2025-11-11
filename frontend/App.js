import Game from "./game/Game.js";

const game = new Game();
game.start();

// prettier-ignore
setInterval(() => {
  console.log("Ticks: " + game.ticks + ", frames: " + game.frames + ", alpha: " + game.alpha);
  game.ticks = 0;
  game.frames = 0;
}, 1000);
