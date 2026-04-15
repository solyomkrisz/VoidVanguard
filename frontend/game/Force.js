import * as vec2 from "/common/vec2.js";

export default class Force {
  static DIRTY = Object.freeze({
    NONE: 0,
    VECTOR: 1 << 0,
  });

  constructor(x = 0, y = 0) {
    this.vector = vec2.fromValues(x, y);
    this.dirty = Force.DIRTY.VECTOR;
    this._magnitude = vec2.len(this.vector);
    this._direction = vec2.normalize(vec2.create(), this.vector);
  }

  setFromVec(vec) {
    vec2.copy(this.vector, this.vector, vec);
    this.dirty |= Force.DIRTY.VECTOR;

    return this;
  }

  setFromXY(x, y) {
    vec2.set(this.vector, x, y);
    this.dirty |= Force.DIRTY.VECTOR;

    return this;
  }

  setFromMagDir(magnitude, direction) {
    vec2.copy(this.vector, direction);
    vec2.scale(this.vector, this.vector, magnitude);
    this.dirty |= Force.DIRTY.VECTOR;

    return this;
  }

  negate() {
    vec2.scale(this.vector, this.vector, -1);

    return this;
  }

  apply(force) {
    vec2.add(this.vector, this.vector, force.vector);
    this.dirty |= Force.DIRTY.VECTOR;

    return this;
  }

  reset() {
    vec2.reset(this.vector);
    this.dirty |= Force.DIRTY.VECTOR;

    return this;
  }

  update() {
    if (this.dirty === Force.DIRTY.NONE) return;

    this._magnitude = vec2.len(this.vector);
    this._direction = vec2.normalize(this._direction, this.vector);

    this.dirty &= ~Force.DIRTY.VECTOR;
  }

  magnitude() {
    return this._magnitude;
  }

  direction() {
    return this._direction;
  }
}
