import * as vec2 from "../common/vec2.js";

export default class Collidable {
  static MODEL_CENTER = vec2.create();

  constructor(game, model) {
    this.game = game;
    this.model = model;

    this.id = null;
    this.cell = [];
    this.proxyCollider = null;
    this.shapeCollider = null;
  }

  setProxyCollider(collider) {
    this.proxyCollider = collider;
    this.proxyCollider.onAttach(this);
    return this;
  }

  setShapeCollider(collider) {
    this.shapeCollider = collider;
    this.shapeCollider.onAttach(this);
    return this;
  }

  onBroadCollision() {
    console.warn("onBroadCollision() must be implemented by the subclass!");
  }

  onNarrowCollision() {
    console.warn("onNarrowCollision() must be implemented by the subclass!");
  }
}
