/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/collider/AABB.js
 * Szerep: Tengelyekhez igazodo befoglalo doboz collider.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { getMinMaxXY } from "/common/common.js";
import Collider from "/game/Collider.js";

export default class AABB extends Collider {
  static DIRTY = Object.freeze({
    NONE: 0,
  });

  constructor(entity = null) {
    super(entity);

    this.dirty = AABB.DIRTY.NONE;

    this.minX = Infinity;
    this.minY = Infinity;
    this.maxX = -Infinity;
    this.maxY = -Infinity;
  }

  onAttach(entity) {
    throw new Error("AABB-onAttach: the method is not yet implemented!");
  }

  validate() {
    throw new Error("AABB-validate: the method is not yet implemented!");
  }

  onGeometryChange() {
    throw new Error(
      "AABB-onGeometryChange: the method is not yet implemented!"
    );
  }

  onPositionChange() {
    throw new Error(
      "AABB-onPositionChange: the method is not yet implemented!"
    );
  }

  set() {
    this.minX = Infinity;
    this.minY = Infinity;
    this.maxX = -Infinity;
    this.maxY = -Infinity;

    this.entity.game.buffer.arrn_1.length = 0;

    const [minX, minY, maxX, maxY] = getMinMaxXY(
      this.entity.game.buffer.arrn_1,
      this.entity.model.objects
    );

    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;

    return this;
  }

  register() {
    throw new Error("AABB-register: the method is not yet implemented!");
  }

  intersects(other) {
    throw new Error("AABB-intersects: the method is not yet implemented!");
  }

  debug() {
    throw new Error("AABB-debug: the method is not yet implemented!");
  }
}
