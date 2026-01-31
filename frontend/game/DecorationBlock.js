import * as vec2 from "../common/vec2.js";
import * as vec3 from "../common/vec3.js";

// A lightweight version of Rigidbody for background blocks
export default class DecorationBlock {
  static TEXTURE_WIDTH = 64;
  static TEXTURE_HEIGHT = 64;

  // prettier-ignore
  constructor({ type, game, x, y, density } = {}) {
    this.type = type;
    this.game = game;
    this.position = vec2.fromValues(x, y);
    this.density = density;
    this.id = `${this.position[0]},${this.position[1]}`;
    this.pixels = null;
    this.textureLayerId = null;
  }

  onRemove() {
    this.game.layerId.release(this.textureLayerId);
    this.textureLayerId = null;

    return this;
  }

  onInsert() {
    if (!this.pixels) {
      setTimeout(() => {
        this.pixels = this.game.ng.get(this.position, true);

        // prettier-ignore
        if (this.density > 0.72) {
          let radius = 1;

          if (this.density > 0.9) radius = 6;
          else if (this.density > 0.8) radius = 2;

          this.game.sg.populate(this.position, this.pixels, radius);
        }

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
    const size = 1 * 0.5 * g.cameraMatrix[0] * g.canvas.width * g.backgroundZoom;

    const position = vec2.copy(b.vec2_1, this.position);

    // translate by 0.5 because we do the same in the vertex shader
    position[0] += 0.5;
    position[1] += 0.5;

    vec2.scale(position, position, g.backgroundZoom);

    const worldSpace = vec2.toVec3(b.vec3_1, position);
    const [csx, csy] = vec3.toVec2(b.vec2_1, vec3.transformMat3Into(worldSpace, g.cameraMatrix, worldSpace));

    const x = (csx + 1) * 0.5 * g.canvas.width;
    const y = (1 - csy) * 0.5 * g.canvas.height;

    d.drawBox(x, y, size, size, "gray", 1);
  }
}
