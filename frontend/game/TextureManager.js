import Sprite from "/game/Sprite.js";
import WebGL from "/game/WebGL.js";
import * as MATRIX from "/common/common.js";

export default class TextureManager {
  /** Provides 8 texture slots. (Thats what WebGL2 provides at minimum.) */
  static S0 = 0;
  static S1 = 1;
  static S2 = 2;
  static S3 = 3;
  static S4 = 4;
  static S5 = 5;
  static S6 = 6;
  static S7 = 7;

  static TEXTURE_EXISTS(textureManager, name) {
    return textureManager.texture[name] !== undefined;
  }

  /**
   * Returns the texture coordinates for a given tile in a texture atlas.
   * 0, 0 coordinate is at the top left.
   *
   * @param {*} tileNumX - Width of the tile atlas on the x axis.
   * @param {*} tileNumY - Height of the tile atlas on the y axis.
   * @param {*} offsetX - Offset of the desired tile on the x axis.
   * @param {*} offsetY - Offset of the desired tile on the y axis.
   * @returns {Float32Array | Array}
   */
  static GET_UV_COORD(tileNumX, tileNumY, offsetX, offsetY) {
    // Add a small inset (0.01) to prevent texture bleeding from adjacent tiles
    const inset = 0.00175;
    const u0 = offsetX / tileNumX + inset;
    const u1 = (offsetX + 1) / tileNumX - inset;
    const v0 = (tileNumY - 1 - offsetY) / tileNumY + inset;
    const v1 = (tileNumY - 1 - offsetY + 1) / tileNumY - inset;

    return new MATRIX.DATA_STRUCTURE([u0, v0, u1, v1]);
  }

  constructor(game) {
    this.game = game;
    this.promises = [];
    this.textureCoordinateQueue = [];
    this.texture = [];
    this.textureCoordinates = {};
    this.activeSlot = TextureManager.S0;
    this.sprites = {};
    this.spriteKeys = Object.keys(this.sprites);
  }

  setActiveSlot(slot) {
    if (typeof slot != "number") {
      throw new Error(
        "TEXTUREMANAGER-setActiveSlot: The value for the 'slot' parameter is not a number!"
      );
    }

    if (slot < 0 || slot > 7) {
      throw new Error(
        "TEXTUREMANAGER-setActiveSlot: Value for slot is out of range. It must be between 0 and 7."
      );
    }

    this.activeSlot = slot;
  }

  loadFromActiveSlot() {
    if (!this.texture[this.activeSlot]) {
      throw new Error(
        `TEXTUREMANAGER-loadFromActiveSlot: There is no texture bound to the slot (${this.activeSlot}) which you marked as active!`
      );
    }

    const gl = this.game.gl;

    gl.activeTexture(gl.TEXTURE0 + this.activeSlot);
    gl.bindTexture(gl.TEXTURE_2D, this.texture[this.activeSlot].gl_texture);
    const samplerLoc = gl.getUniformLocation(this.game.glProgram, "uTexture");
    gl.uniform1i(samplerLoc, 0);
  }

  addTexture(slot, path, tileNumX, tileNumY) {
    WebGL.THROW_NO_GL_ERROR(this.game.gl, "addTexture");

    if (typeof slot != "number") {
      throw new Error(
        "TEXTUREMANAGER-addTexture: The value for the 'slot' parameter is not a number!"
      );
    }

    if (slot < 0 || slot > 7) {
      throw new Error(
        "TEXTUREMANAGER-addTexture: Value for slot is out of range. It must be between 0 and 7."
      );
    }

    this.promises.push(
      new Promise((resolve, reject) => {
        const gl = this.game.gl;

        const texture = gl.createTexture();

        const image = new Image();
        image.src = path;

        // prettier-ignore
        image.onload = () => {

          gl.bindTexture(gl.TEXTURE_2D, texture);

          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

          gl.bindTexture(gl.TEXTURE_2D, null);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

          this.texture[slot] = {
            gl_texture: texture,
            tileNumX: tileNumX,
            tileNumY: tileNumY,
            image: image
          };

          resolve(slot);
        };

        image.onerror = function () {
          reject(
            new Error(
              "TEXTUREMANAGER-addTexture: Failed to load texture: " + path
            )
          );
        };
      })
    );
  }

  // prettier-ignore
  queueTextureCoordinate(name, slot, offsetX, offsetY) {
    this.textureCoordinateQueue.push({ name, slot, offsetX, offsetY });
  }

  addTextureCoordinates(name, slot, offsetX, offsetY) {
    if (this.texture.length - 1 < slot) {
      throw new Error(
        "TEXTUREMANAGER-addTextureCoordinates: The texture you are looking for doesn't exist!"
      );
    }

    const { tileNumX, tileNumY } = this.texture[slot];

    // prettier-ignore
    this.textureCoordinates[name] = {
      slot: slot,
      coordinates: TextureManager.GET_UV_COORD(tileNumX, tileNumY, offsetX, offsetY),
    };
  }

  addSprite(name, sprite) {
    if (!(sprite instanceof Sprite)) {
      throw new Error(
        "TEXTUREMANAGER-addSprite: The provided value is not a Sprite!"
      );
    }

    this.sprites[name] = sprite;
    this.spriteKeys = Object.keys(this.sprites);
  }

  updateSprites() {
    this.spriteKeys.forEach((key) => this.sprites[key].update(this.game.vdt));
  }
}
