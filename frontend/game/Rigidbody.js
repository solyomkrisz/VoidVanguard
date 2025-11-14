import * as vec2 from "../common/vec2.js";
import * as mat2 from "../common/mat2.js";

export default class Rigidbody {
  constructor({ model, x, y } = {}) {
    this.model = model;
    this.position = vec2.fromValues(x, y);
    this.rotation = 0;
  }

  render(game) {
    const gl = game.gl;
    const glHandles = game.glHandles;
    const uniform = glHandles.uniform;

    for (const obj of this.model) {
      gl.uniform2f(uniform.localPosition, ...obj.localPosition);
      gl.uniform2f(uniform.parentPosition, ...this.position);
      gl.uniformMatrix2fv(
        uniform.rotationMatrix,
        false,
        mat2.fromRotation(mat2.identity(), this.rotation)
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  update() {}
}
