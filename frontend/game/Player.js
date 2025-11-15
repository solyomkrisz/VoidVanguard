import Keyboard from "./Keyboard.js";
import Spaceship from "./Spaceship.js";
import Block from "./Block.js";
import * as vec2 from "../common/vec2.js";
import * as mat2 from "../common/mat2.js";

export default class Player extends Spaceship {
  static MODEL = [
    new Block(0, 0),
    new Block(-1, 0),
    new Block(1, 0),
    new Block(0, 1),
  ];

  constructor() {
    super({ model: Player.MODEL, x: 0, y: 0, vx: 5, vy: 5 });
  }

  // prettier-ignore
  update(game, dt) {
    const b = game.buffer;
    const activeControls = game.keyboard.activeControls;
    vec2.mul(b.vec2_1, this.velocity, this.forward);

    if (activeControls.has(Keyboard.KeyA)) {
      this.rotation += 2.5 * dt;
    }
    if (activeControls.has(Keyboard.KeyD)) {
      this.rotation -= 2.5 * dt;
    }

    const rotationMatrix = mat2.fromRotation(b.mat2_1, this.rotation - this.previousRotation);
    vec2.transformMat2(this.forward, rotationMatrix, this.forward);
    vec2.normalize(this.forward, this.forward);

    if (activeControls.has(Keyboard.KeyW)) {
      vec2.addScaled(this.position, this.position, b.vec2_1, dt);
    }
    if (activeControls.has(Keyboard.KeyS)) {
      vec2.scale(b.vec2_1, b.vec2_1, -1);
      vec2.addScaled(this.position, this.position, b.vec2_1, dt);
    }
  }
}
