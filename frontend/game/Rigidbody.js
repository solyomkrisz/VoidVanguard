import * as vec2 from "../common/vec2.js";
import * as mat2 from "../common/mat2.js";
import { LERP } from "../common/common.js";
import Collidable from "./Collidable.js";
import BC from "./collider/BC.js";

export default class Rigidbody extends Collidable {
  constructor({ game, model, x, y, vx, vy } = {}) {
    super(game, model);

    this.setProxyCollider(new BC(this));

    this.position = vec2.fromValues(x, y);
    this.previousPosition = vec2.fromValues(x, y);
    this.interpolatedPosition = vec2.fromValues(x, y);
    this.velocity = vec2.fromValues(vx, vy);
    this.forward = vec2.fromValues(0, 1);
    this.previousForward = vec2.fromValues(0, 1);
    this.rotation = 0;
    this.previousRotation = 0;
    this.interpolatedRotation = 0;
  }

  debug() {
    this.proxyCollider.debug();
  }

  save() {
    this.previousPosition.set(this.position);
    this.previousRotation = this.rotation;
    this.previousForward.set(this.forward);
  }

  // prettier-ignore
  render() {
    const _b = this.game.buffer;

    this.interpolatedPosition = vec2.lerp(this.interpolatedPosition, this.previousPosition, this.position, this.game.alpha);
    this.interpolatedRotation = LERP(this.previousRotation, this.rotation, this.game.alpha);
    const rotationMatrix = mat2.fromRotation(_b.mat2_1, this.interpolatedRotation);

    for (const obj of this.model) {
      const sprite = this.game.textureManager.sprites[obj.spriteId];
      const [u0, v0, u1, v1] = this.game.textureManager.textureCoordinates[sprite.getCurrentTexture()].coordinates;

      vec2.set(_b.vec2_2, u0, v0);
      vec2.set(_b.vec2_3, u1 - u0, v1 - v0);

      this.game.dataCollector.push(
        ...obj.localPosition,
        ...this.interpolatedPosition,
        ...rotationMatrix,
        ..._b.vec2_2,
        ..._b.vec2_3,
      );
    }

    this.debug(); // Must be down here because vec2_1 is used inside it, so it would overwrite it
  }

  update() {
    console.warn("update() must be implemented by the subclass!");
  }
}
