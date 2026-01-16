import * as vec2 from "../common/vec2.js";

export default class Collision {
  static EPSILON = 0.001;

  static TYPE = Object.freeze({
    NONE: 0,
    RIGIDBODY: 1 << 0,
    INTERACTION: 1 << 1,
  });

  constructor() {
    this.type = Collision.TYPE.NONE;
    this.status = false;
    this.a = null;
    this.b = null;
    this.depth = 0;
    this.normal = vec2.create();
    this.subCollisions = [];
  }

  reset() {
    this.status = false;
    this.a = null;
    this.b = null;
    this.depth = 0;
    vec2.reset(this.normal);
    this.subCollisions.length = 0;

    return this;
  }

  // prettier-ignore
  resolvePenetration() {
    vec2.normalize(this.normal, this.normal); // Must be normalized here because of the accumulating approach we use

    this.a.resolvePenetration(this.b, this, Collision.EPSILON, -1);
    this.b.resolvePenetration(this.a, this, Collision.EPSILON, 1);

    this.a.onPositionChange();
    this.b.onPositionChange();

    return this;
  }
}
