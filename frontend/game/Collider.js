/**
 * Its important that all object must use the same collider for the given phase.
 */
export default class Collider {
  constructor(entity) {
    this.entity = entity;
  }

  /**
   * This function should evalute whether the collider needs updates based on its dirty state.
   */
  validate() {
    console.warn("validate() must be implemented by the subclass!");
  }

  /**
   * Call this whenever the model changes! This should mark the colliders dirty so that they are recalculated with the new model in mind!
   */
  onGeometryChange() {
    console.warn("onGeometryChange() must be implemented by the subclass!");
  }

  /**
   * Call this whenever Rigidbody.previousPosition !== Rigidbody.position. This should force the colliders to recalculate their bounds.
   */
  onPositionChange() {
    console.warn("onPositionChange() must be implemented by the subclass!");
  }

  /**
   * This function should take care of updating the collider.
   */
  set() {
    console.warn("set() must be implemented by the subclass!");
  }

  /**
   * This function is responsible for placing its parent entity into the right grid cell(s).
   */
  register() {
    console.warn("register() must be implemented by the subclass!");
  }

  /**
   * This function must compare two of the same type colliders and return a boolean value representing the state of the collision between the two.
   */
  intersects() {
    console.warn("intersects() must be implemented by the subclass!");
  }

  /**
   * Used for visualizing the collider, etc.
   */
  debug() {
    console.warn("debug() must be implemented by the subclass!");
  }
}
