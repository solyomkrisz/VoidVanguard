import * as vec2 from "../common/vec2.js";
import * as mat2 from "../common/mat2.js";
import { LERP } from "../common/common.js";

export default class Rigidbody {
  constructor({ model, x, y, vx, vy } = {}) {
    this.model = model;
    this.position = vec2.fromValues(x, y);
    this.previousPosition = vec2.fromValues(x, y);
    this.velocity = vec2.fromValues(vx, vy);
    this.forward = vec2.fromValues(0, 1);
    this.previousForward = vec2.fromValues(0, 1);
    this.rotation = 0;
    this.previousRotation = 0;
  }

  save() {
    this.previousPosition.set(this.position);
    this.previousRotation = this.rotation;
    this.previousForward.set(this.forward);
  }

  // prettier-ignore
  render(game) {
    const b = game.buffer;

    for (const obj of this.model) {
      game.dataCollector.push(
        ...obj.localPosition,
        ...vec2.lerp(b.vec2_1, this.previousPosition, this.position, game.alpha),
        ...mat2.fromRotation(b.mat2_1, LERP(this.previousRotation, this.rotation, game.alpha))
      );
    }
  }

  update(game, dt) {}
}
