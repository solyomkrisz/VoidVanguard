import Rigidbody from "./Rigidbody.js";

export default class Spaceship extends Rigidbody {
  constructor({ model, x, y, vx, vy } = {}) {
    super({ model, x, y, vx, vy });
  }

  update(game, dt) {}
}
