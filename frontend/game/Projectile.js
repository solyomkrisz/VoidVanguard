import Block from "./Block.js";
import Rigidbody from "./Rigidbody.js";
import { SpriteID } from "./texture/Texture.js";
import * as vec2 from "../common/vec2.js";

export default class Projectile extends Rigidbody {
  // prettier-ignore
  static MODEL = [
    new Block(0, 0, SpriteID.TEST)
  ];

  constructor({ x, y, vx, vy, dmg = 0 } = {}) {
    super({
      model: Projectile.MODEL,
      x: x,
      y: y,
      vx: vx,
      vy: vy,
    });

    this.dmg = dmg;
  }

  update(game, dt) {
    const b = game.buffer;

    vec2.copy(b.vec2_1, this.velocity);
    vec2.mul(b.vec2_1, b.vec2_1, this.forward);
    vec2.scale(b.vec2_1, b.vec2_1, dt);

    vec2.add(this.position, this.position, b.vec2_1);
  }
}
