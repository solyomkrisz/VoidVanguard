import Rigidbody from "./Rigidbody.js";

export default class Spaceship extends Rigidbody {
  constructor({ model, x, y, vx, vy } = {}) {
    super({ model, x, y, vx, vy });

    this.shootCooldown = 0;
  }

  shoot() {
    console.warn("shoot() must be implemented by the subclass!");
  }

  update(game, dt) {
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
  }
}
