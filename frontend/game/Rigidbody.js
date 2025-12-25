import * as vec2 from "../common/vec2.js";
import * as mat2 from "../common/mat2.js";
import { LERP } from "../common/common.js";
import Collidable from "./Collidable.js";
import BC from "./collider/BC.js";
import CompositeCollider from "./collider/CompositeCollider.js";
import Force from "./Force.js";
import * as Type from "./Type.js";

export default class Rigidbody extends Collidable {
  // prettier-ignore
  constructor({ type = Type.UNKNOWN, game, model, parent = null, x = 0, y = 0, vx = 0, vy = 0, maxSpeed = 1, maxAngularSpeed = 1 } = {}) {
    super(game, model);

    this.type = type;
    this.parent = parent;

    this.setProxyCollider(new BC());
    this.setShapeCollider(new CompositeCollider());

    this.position = vec2.fromValues(x, y);
    this.previousPosition = vec2.fromValues(x, y);
    this.interpolatedPosition = vec2.fromValues(x, y);
    this.velocity = vec2.fromValues(vx, vy);
    this.acceleration = vec2.create();
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
    this.maxSpeed = maxSpeed;
    this.maxAngularSpeed = maxAngularSpeed;
    this.forward = vec2.fromValues(0, 1);
    this.previousForward = vec2.fromValues(0, 1);
    this.rotation = 0;
    this.previousRotation = 0;
    this.interpolatedRotation = 0;
    this.state = new Uint32Array(2);
    this.mass = 0;
    this.CoM = vec2.create();
    this.I = 0;
    this.netForce = new Force();
    this.previousNetForce = new Force();

    this.setMassAndCoM();
    this.setMomentOfInertia();
  }

  setState(state) {
    const i = Math.floor(state / 32);
    const b = state % 32;

    if (i >= this.state.length) {
      const newState = new Uint32Array(i + 1);
      newState.set(this.state);
      this.state = newState;
    }

    this.state[i] |= 1 << b;
  }

  hasState(state) {
    const i = Math.floor(state / 32);
    const b = state % 32;

    return this.state[i] ? ((this.state[i] >> b) & 1) !== 0 : false;
  }

  clearState(state) {
    const i = Math.floor(state / 32);
    const b = state % 32;

    if (i < this.state.length) this.state[i] &= ~(1 << b);
  }

  setMassAndCoM() {
    this.mass = 0;
    vec2.reset(this.CoM);

    for (const object of this.model.objects) {
      this.mass += object.mass;
      vec2.addScaled(this.CoM, this.CoM, object.localPosition, object.mass);
    }

    vec2.scale(this.CoM, this.CoM, 1 / this.mass);
  }

  setMomentOfInertia() {
    const _b = this.game.buffer;

    this.I = 0;

    for (const object of this.model.objects) {
      const r = vec2.sub(_b.vec2_1, object.CoM, this.CoM);
      this.I += object.mass * vec2.dot(r, r);
    }
  }

  apply(rigidbody) {
    vec2.copy(this.position, rigidbody.position);
    vec2.copy(this.previousPosition, rigidbody.previousPosition);
    vec2.copy(this.interpolatedPosition, rigidbody.interpolatedPosition);
    vec2.copy(this.velocity, rigidbody.velocity);
    vec2.copy(this.forward, rigidbody.forward);
    vec2.copy(this.previousForward, rigidbody.previousForward);

    this.angularAcceleration = rigidbody.angularAcceleration;
    this.angularVelocity = rigidbody.angularVelocity;
    this.rotation = rigidbody.rotation;
    this.previousRotation = rigidbody.previousRotation;
    this.interpolatedRotation = rigidbody.interpolatedRotation;

    return this;
  }

  debug() {
    this.proxyCollider.debug();
    this.shapeCollider.debug();
  }

  save() {
    this.previousPosition.set(this.position);
    this.previousRotation = this.rotation;
    this.previousForward.set(this.forward);
  }

  is(type) {
    return this.type === type;
  }

  isDragged() {
    return this.game.mouse.dragged === this;
  }

  posDiff() {
    const vec2_1 = this.game.buffer.vec2_1;

    vec2.copy(vec2_1, this.position);
    vec2.sub(vec2_1, vec2_1, this.previousPosition);

    return vec2.len(vec2_1);
  }

  // prettier-ignore
  render() {
    this.previousNetForce.reset();

    const _b = this.game.buffer;

    this.interpolatedPosition = vec2.lerp(this.interpolatedPosition, this.previousPosition, this.position, this.game.alpha);
    this.interpolatedRotation = LERP(this.previousRotation, this.rotation, this.game.alpha);
    const rotationMatrix = mat2.fromRotation(_b.mat2_1, this.interpolatedRotation);

    for (const obj of this.model.objects) {
      if (obj.spriteId === null) continue;

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

  // prettier-ignore
  updateVelocity() {
    const friction = 0.04;

    vec2.scale(this.acceleration, this.netForce.vector, 1 / this.mass);
    vec2.addScaled(this.velocity, this.velocity, this.acceleration, this.game.fdt);
    vec2.scale(this.velocity, this.velocity, 1 - friction);

    const speed = vec2.len(this.velocity);

    if (speed > this.maxSpeed) {
      const scale = this.maxSpeed / speed;
      vec2.scale(this.velocity, this.velocity, scale);
    }

    speed < 0.05 && vec2.reset(this.velocity);
  }

  updatePosition() {
    vec2.addScaled(this.position, this.position, this.velocity, this.game.fdt);

    if (!vec2.isEqual(this.previousPosition, this.position, 0)) {
      this.onPositionChange();
    }
  }

  updateAngularVelocity() {
    const angularFriction = 0.04;

    this.angularVelocity += this.angularAcceleration * this.game.fdt;
    this.angularVelocity *= 1 - angularFriction;

    const angularSpeed = Math.abs(this.angularVelocity);

    if (angularSpeed > this.maxAngularSpeed) {
      this.angularVelocity =
        Math.sign(this.angularVelocity) * this.maxAngularSpeed;
    }

    angularSpeed < 0.05 && (this.angularVelocity = 0);
  }

  updateRotation() {
    const _b = this.game.buffer;

    this.rotation += this.angularVelocity * this.game.fdt;

    // prettier-ignore
    if (this.previousRotation !== this.rotation) {
      const rotationMatrix = mat2.fromRotation(_b.mat2_1, this.rotation - this.previousRotation);
      vec2.transformMat2(this.forward, rotationMatrix, this.forward);
      vec2.normalize(this.forward, this.forward);

      this.onRotationChange();
    }
  }

  update() {
    console.warn("update() must be implemented by the subclass!");
  }
}
