import Rigidbody from "./Rigidbody.js";

export default class Spaceship extends Rigidbody {
  constructor({ game, model, x, y, vx, vy, maxSpeed } = {}) {
    super({ game, model, x, y, vx, vy, maxSpeed });

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
