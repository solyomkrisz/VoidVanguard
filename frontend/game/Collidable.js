import * as vec2 from "../common/vec2.js";

export default class Collidable {
  static MODEL_CENTER = vec2.create();

  constructor(model, proxyCollider) {
    this.model = model;

    this.id = null;
    this.cell = [];
    this.proxyCollider = proxyCollider;
  }

  onBroadCollision() {
    console.warn("onBroadCollision() must be implemented by the subclass!");
  }
}
