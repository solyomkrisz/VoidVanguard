import * as vec2 from "../common/vec2.js";
import * as mat2 from "../common/mat2.js";

export default class Rigidbody {
  constructor({ model, x, y, vx, vy } = {}) {
    this.model = model;
    this.position = vec2.fromValues(x, y);
    this.velocity = vec2.fromValues(vx, vy);
    this.forward = vec2.fromValues(0, 1);
    this.rotation = 0;
    this.previousRotation = 0;
  }

  save() {
    this.previousRotation = this.rotation;
  }

  render(game) {
    for (const obj of this.model) {
      game.dataCollector.push(
        ...obj.localPosition,
        ...this.position,
        ...mat2.fromRotation(mat2.identity(), this.rotation)
      );
    }
  }

  update(game, dt) {}
}
