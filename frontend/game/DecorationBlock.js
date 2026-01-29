import * as vec2 from "../common/vec2.js";
import * as vec3 from "../common/vec3.js";

// A lightweight version of Rigidbody for background blocks
export default class DecorationBlock {
  static TEXTURE_WIDTH = 16;
  static TEXTURE_HEIGHT = 16;

  // prettier-ignore
  constructor({ type, game, x, y } = {}) {
    this.type = type;
    this.game = game;
    this.position = vec2.fromValues(x, y);
    this.id = `${this.position[0]},${this.position[1]}`;
    this.pixels = null;
    this.textureLayerId = null;
  }

  onRemove() {
    this.game.layerId.release(this.textureLayerId);
    this.textureLayerId = null;

    return this;
  }

  onInsert(distanceFromPlayer) {
    if (!this.pixels) {
      setTimeout(() => {
        this.pixels = this.game.ng.get(this.position, true);
        this.createTexture();
      }, 10);
    } else {
      this.createTexture();
    }

    return this;
  }

  update() {
    return;
  }

  // prettier-ignore
  render() {
    this.game.dataCollector.push(0, 0, ...this.position, 1, 0, 0, 1, 0, 0, 1, 1, this.textureLayerId);

    // this.debug();
  }

  // prettier-ignore
  createTexture() {
    if (this.textureLayerId) return;

    const gl = this.game.gl;

    this.textureLayerId = this.game.layerId.get();

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.game.textureArray);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, this.textureLayerId, DecorationBlock.TEXTURE_WIDTH, DecorationBlock.TEXTURE_HEIGHT, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
  }

  // prettier-ignore
  debug() {
    const g = this.game, b = g.buffer, d = g.debugOverlay;
    const size = 1 * 0.5 * g.cameraMatrix[0] * g.canvas.width;

    const position = vec2.copy(b.vec2_1, this.position);

    const worldSpace = vec2.toVec3(b.vec3_1, position);
    const [csx, csy] = vec3.toVec2(b.vec2_1, vec3.transformMat3Into(worldSpace, g.cameraMatrix, worldSpace));

    const x = (csx + 1) * 0.5 * g.canvas.width;
    const y = (1 - csy) * 0.5 * g.canvas.height;

    d.drawBox(x, y, size, size, "gray");
  }
}
