import Block from "/game/Block.js";
import Rigidbody from "/game/Rigidbody.js";
import { SpriteID } from "/game/texture/Texture.js";
import * as vec2 from "/common/vec2.js";
import Model from "/game/Model.js";
import Shape from "/game/Shape.js";

export default class Projectile extends Rigidbody {
  // prettier-ignore
  static MODEL = [
    new Block({ x: 0, y: 0, shape: new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5), spriteID: SpriteID.BLOCK_0 })
  ];

  constructor({ game, x, y, vx, vy, dmg = 0 } = {}) {
    super({
      game,
      model: new Model(Projectile.MODEL),
      x: x,
      y: y,
      vx: vx,
      vy: vy,
    });

    this.id = game.idManager.get();
    this.dmg = dmg;
  }

  update() {
    const dt = this.game.fdt;
    const _b = this.game.buffer;

    this.updatePosition();
  }

  onBroadCollision() {
    return true;
  }

  onNarrowCollision() {
    return true;
  }
}
