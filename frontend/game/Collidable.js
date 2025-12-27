import * as vec2 from "../common/vec2.js";

export default class Collidable {
  static MODEL_CENTER = vec2.create();

  constructor(game, model) {
    this.halfDiagonal = Math.SQRT2 / 2;

    this.game = game;
    this.model = model;

    this.id = null;
    this.cell = [];
    this.proxyCollider = null;
    this.shapeCollider = null;
    this.contactCollider = null;
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

  setContactCollider(collider) {
    this.contactCollider = collider;
    this.contactCollider.onAttach(this);
    return this;
  }

  onPositionChange() {
    this.proxyCollider.onPositionChange();
    this.shapeCollider.onPositionChange();
  }

  onRotationChange() {
    this.proxyCollider.onRotationChange();
    this.shapeCollider.onRotationChange();
  }

  onGeometryChange() {
    this.proxyCollider.onGeometryChange();
    this.shapeCollider.onGeometryChange();
  }

  onBroadCollision(other) {
    console.warn("onBroadCollision() must be implemented by the subclass!");
  }

  onNarrowCollision(other) {
    console.warn("onNarrowCollision() must be implemented by the subclass!");
  }

  onContact(object) {
    // console.warn("onContact() must be implemented by the subclass!");
  }
}
