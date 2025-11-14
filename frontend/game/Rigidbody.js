import * as vec2 from "../common/vec2.js";
import * as mat2 from "../common/mat2.js";

export default class Rigidbody {
  constructor({ model, x, y } = {}) {
    this.model = model;
    this.position = vec2.fromValues(x, y);
    this.rotation = 0;
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

  update() {}
}
