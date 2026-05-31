/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/DecorationBlock.js
 * Szerep: Hatterdekor blokk kod- es csillagretegek kirajzolasahoz.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as vec2 from "/common/vec2.js";
import * as vec3 from "/common/vec3.js";

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
    this.starPixels = null;
    this.textureLayerId = null;
    this.starTextureLayerId = null;
    this.instanceParallax = game.nebulaParallax;
  }

  onRemove() {
    this.game.layerId.release(this.textureLayerId);
    this.textureLayerId = null;

    if (this.starTextureLayerId) {
      this.game.layerId.release(this.starTextureLayerId);
      this.starTextureLayerId = null;
    }

    return this;
  }

  onInsert() {
    if (!this.pixels) {
      this.game._textureBuildQueue.push(() => {
        this.pixels = this.game.ng.get(this.position, true);

        // prettier-ignore
        {
          let radius;
          let starCount;

          if      (this.density > 0.9)  { radius = 2; starCount = 10; }
          else if (this.density > 0.8)  { radius = 2; starCount = 6; }
          else if (this.density > 0.5) { radius = 1; starCount = 4; }
          else                          { radius = 1; starCount = 3; }

          // minden elem clampelve van 0, 255 közé
          this.starPixels = new Uint8ClampedArray(DecorationBlock.TEXTURE_WIDTH * DecorationBlock.TEXTURE_HEIGHT * 4);

          let distanceFactor = 1;
          // Each call to populate uses a different integer offset so it picks
          // a different noise bucket, placing a distinct star in the texture.
          for (let i = 0; i < starCount; i++) {
            const offsetPos = [this.position[0] + i * 7, this.position[1] + i * 13];
            ({ distanceFactor } = this.game.sg.populate(offsetPos, this.starPixels, radius));
          }

          if (this.density > 0.72) {
            this.instanceParallax = this.game.nebulaParallax * (0.01 + distanceFactor * 0.15);
          }
        }

        this.createTexture();
        if (this.starPixels) this.createStarTexture();
      });
    } else {
      this.createTexture();
      if (this.starPixels) this.createStarTexture();
    }

    return this;
  }

  update() {
    return;
  }

  // prettier-ignore
  renderNebula() {
    if (this.game.showNebula && this.textureLayerId) {
      this.game.dataCollector.push(0, 0, ...this.position, 1, 0, 0, 1, 0, 0, 1, 1, 0, this.textureLayerId, this.game.nebulaParallax);
    }
  }

  // prettier-ignore
  renderStars() {
    if (this.game.showNebula && this.starTextureLayerId) {
      this.game.dataCollector.push(0, 0, ...this.position, 1, 0, 0, 1, 0, 0, 1, 1, 0, this.starTextureLayerId, this.instanceParallax);
    }

    // this.debug();
  }

  // prettier-ignore
  createTexture() {
    if (this.textureLayerId) return;

    const gl = this.game.gl;

    this.textureLayerId = this.game.layerId.get();

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.game.textureArray);
    gl.texSubImage3D(
      gl.TEXTURE_2D_ARRAY, // target
      0, // mip level - still no mips so select first one which is 0
      0, 0, this.textureLayerId, // xoffset, yoffset zoffset
      DecorationBlock.TEXTURE_WIDTH, // width
      DecorationBlock.TEXTURE_HEIGHT, // height
      1, // depth - upload exactly one layer, starting from xoffset, yoffset, zoffset
      gl.RGBA, // format - incoming pixel layout
      gl.UNSIGNED_BYTE, // type - each channel (R, G, B, A) [0, 255]
      this.pixels // data
    );
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
  }

  // prettier-ignore
  createStarTexture() {
    if (this.starTextureLayerId) return;

    const gl = this.game.gl;

    this.starTextureLayerId = this.game.layerId.get();

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.game.textureArray);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, this.starTextureLayerId, DecorationBlock.TEXTURE_WIDTH, DecorationBlock.TEXTURE_HEIGHT, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.starPixels);
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
