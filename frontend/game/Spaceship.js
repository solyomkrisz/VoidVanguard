import Rigidbody from "./Rigidbody.js";
import * as Type from "./Type.js";
import IDManager from "./IDManager.js";
import * as vec2 from "../common/vec2.js";

export default class Spaceship extends Rigidbody {
  // prettier-ignore
  constructor({ type = Type.UNKNOWN, game, model, x, y, vx, vy, maxSpeed } = {}) {
    super({ type, game, model, x, y, vx, vy, maxSpeed });

    this.id = game.idManager.get();
    this.idManager = new IDManager();
    this.thrusters = new Map();
    this.controlledThrusters = new Map();
    this.shootCooldown = 0;
  }

  shoot() {
    console.warn("shoot() must be implemented by the subclass!");
  }

  update() {
    const dt = this.game.fdt;
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
  }
}
