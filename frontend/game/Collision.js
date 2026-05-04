import * as vec2 from "/common/vec2.js";
import * as Type from "/game/Type.js";

export default class Collision {
  static EPSILON = 0.001;

  constructor() {
    this.type = Type.NONE;
    this.status = false;
    this.a = null;
    this.b = null;
    this.depth = 0;
    this.normal = vec2.create();
    this.subCollisions = [];
  }

  reset() {
    this.type = Type.NONE;
    this.status = false;
    this.a = null;
    this.b = null;
    this.depth = 0;
    vec2.reset(this.normal);
    this.subCollisions.length = 0;

    return this;
  }

  is(type) {
    return this.type === type;
  }

  resolveVelocity(restitution = 1) {
    vec2.normalize(this.normal, this.normal);

    const rv = vec2.create();
    vec2.subtract(rv, this.b.velocity, this.a.velocity);

    const velAlongNormal = vec2.dot(rv, this.normal);

    if (velAlongNormal > 0) return this;

    const invMassA = this.a.mass ? 1 / this.a.mass : 1;
    const invMassB = this.b.mass ? 1 / this.b.mass : 1;

    const j = (-(1 + restitution) * velAlongNormal) / (invMassA + invMassB);

    const impulse = vec2.create();
    vec2.scale(impulse, this.normal, j);

    const impulseA = vec2.create();
    vec2.scale(impulseA, impulse, invMassA);
    vec2.subtract(this.a.velocity, this.a.velocity, impulseA);

    const impulseB = vec2.create();
    vec2.scale(impulseB, impulse, invMassB);
    vec2.add(this.b.velocity, this.b.velocity, impulseB);

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
