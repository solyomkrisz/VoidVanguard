import * as vec2 from "../common/vec2.js";

// A lightweight version of Rigidbody for background blocks
export default class DecorationBlock {
  constructor({ type, game, x, y, spriteId } = {}) {
    this.type = type;
    this.game = game;
    this.position = vec2.fromValues(x, y);
    this.spriteId = spriteId;
    // this.textureCoordinates =
    //   this.game.textureManager.textureCoordinates[
    //     this.game.textureManager.sprites[this.spriteId].getCurrentTexture()
    //   ].coordinates;
  }

  update() {
    return;
  }

  // prettier-ignore
  render() {
    // const [u0, v0, u1, v1] = this.textureCoordinates;
    this.game.dataCollector.push(0, 0, ...this.position, 1, 0, 0, 1, -1, 0, 0, 0);
  }
}
