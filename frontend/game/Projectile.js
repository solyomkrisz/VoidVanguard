import Block from "./Block.js";
import Rigidbody from "./Rigidbody.js";
import { SpriteID } from "./texture/Texture.js";
import * as vec2 from "../common/vec2.js";

export default class Projectile extends Rigidbody {
  // prettier-ignore
  static MODEL = [
    new Block(0, 0, SpriteID.TEST)
  ];

  constructor({ game, x, y, vx, vy, dmg = 0 } = {}) {
    super({
      game,
      model: Projectile.MODEL,
      x: x,
      y: y,
      vx: vx,
      vy: vy,
    });

    this.dmg = dmg;
  }

  update() {
    const dt = this.game.fdt;
    const _b = this.game.buffer;

    vec2.copy(_b.vec2_1, this.velocity);
    vec2.mul(_b.vec2_1, _b.vec2_1, this.forward);
    vec2.scale(_b.vec2_1, _b.vec2_1, dt);

    vec2.add(this.position, this.position, _b.vec2_1);
  }
}
