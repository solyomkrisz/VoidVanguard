import * as vec2 from "../common/vec2.js";

export default class Collision {
  constructor() {
    this.status = false;
    this.a = null;
    this.b = null;
    this.depth = 0;
    this.normal = vec2.create();
  }

  reset() {
    this.status = false;
    this.a = null;
    this.b = null;
    this.depth = 0;
    vec2.reset(this.normal);

    return this;
  }

  // prettier-ignore
  resolve() {
    const correction = this.depth + 0.001;

    const totalMass = this.a.mass + this.b.mass;

    vec2.subScaled(this.a.position, this.a.position, this.normal, correction * (this.a.mass / totalMass));
    vec2.addScaled(this.b.position, this.b.position, this.normal, correction * (this.b.mass / totalMass));

    vec2.reset(this.a.velocity);
    vec2.reset(this.b.velocity);
  }
}
