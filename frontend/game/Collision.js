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
}
