/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/collider/CompositeCollider.js
 * Szerep: Osszetett collider, amely kisebb konvex reszekre bontja a modellt utkozesvizsgalathoz.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Collider from "/game/Collider.js";
import Rigidbody from "/game/Rigidbody.js";
import AABB from "/game/collider/AABB.js";
import OBP from "/game/collider/OBP.js";
import Shape from "/game/Shape.js";
import * as vec2 from "/common/vec2.js";
import Model from "/game/Model.js";
import Collision from "/game/Collision.js";

export default class CompositeCollider extends Collider {
  static DIRTY = Object.freeze({
    NONE: 0,
    TRANSFORM: 1 << 0,
    LAYOUT: 1 << 1,
  });

  constructor({
    entity = null,
    rule = (current, group) =>
      Shape.IS_STRICT_IDENTICAL(current.shape, group[group.length - 1].shape) &&
      current.shape.mergeable,
  } = {}) {
    super(entity);

    this.rule = rule;
    // prettier-ignore
    this.dirty = CompositeCollider.DIRTY.TRANSFORM | CompositeCollider.DIRTY.LAYOUT;
    this.AABB = new AABB(entity);
    this.decomposed = [];
  }

  onAttach(entity) {
    this.entity = entity;
    this.AABB.entity = entity;
  }

  onGeometryChange() {
    this.dirty |= CompositeCollider.DIRTY.LAYOUT;
  }

  onPositionChange() {
    this.dirty |= CompositeCollider.DIRTY.TRANSFORM;
  }

  onRotationChange() {
    this.dirty |= CompositeCollider.DIRTY.TRANSFORM;
  }

  // prettier-ignore
  createConvexPart(objectGroup) {
    const rigidbody = new Rigidbody({
      parent: this.entity,
      game: this.entity.game,
      // Itt nem másolunk, mert ez csak egy ideiglenes fizikai nézet ugyanazokra a blokkokra.
      model: new Model(objectGroup, Model.COPY_MODE.PRESERVE),
    })
      .apply(this.entity)
      .setShapeCollider(new OBP())
      .setContactCollider(new CompositeCollider({ rule: () => false }));

    this.decomposed.push(rigidbody);
  }

  decompose() {
    this.decomposed.length = 0;

    const { minX, minY, maxX, maxY } = this.AABB.set();

    const w = maxX - minX + 1;
    const h = maxY - minY + 1;

    const grid = Array.from({ length: h }, () =>
      Array.from({ length: w }, () => null)
    );

    for (const object of this.entity.model.objects) {
      const [x, y] = object.localPosition;
      grid[y - minY][x - minX] = object;
    }

    // Soronként végigmegyünk a rácson, és az egymás mellett fekvő, összevonható blokkokból külön részeket csinálunk.
    for (let y = 0; y < h; y++) {
      let group = [];

      for (let x = 0; x < w; x++) {
        const object = grid[y][x];

        // A rule dönti el, hogy a következő blokk még ugyanabba a konvex csoportba tartozhat-e.
        if (object && (!group.length || this.rule(object, group))) {
          group.push(object);
        } else if (group.length) {
          this.createConvexPart(group);
          group = [];
          object && group.push(object);
        }
      }

      group.length && this.createConvexPart(group);
    }

    this.dirty &= ~CompositeCollider.DIRTY.LAYOUT;

    return this;
  }

  validate() {
    if (this.dirty === CompositeCollider.DIRTY.NONE) return;
    if (this.dirty & CompositeCollider.DIRTY.LAYOUT) this.decompose();

    // prettier-ignore
    if (this.dirty & CompositeCollider.DIRTY.TRANSFORM) {
      for (const rigidbody of this.decomposed) {
        rigidbody.apply(this.entity);
        rigidbody.shapeCollider.onPositionChange();
        rigidbody.shapeCollider.onRotationChange();
        rigidbody.shapeCollider.validate();
        rigidbody.contactCollider.onPositionChange();
        rigidbody.contactCollider.onRotationChange();
      }

      this.dirty &= ~CompositeCollider.DIRTY.TRANSFORM;
    }
  }

  intersects(other, getDecomposed = (other) => other.shapeCollider) {
    const collision = new Collision();

    for (const a of this.decomposed) {
      for (const b of getDecomposed(other).decomposed) {
        const subCollision = a.shapeCollider.intersects(b);

        if (!subCollision.status) continue;

        collision.subCollisions.push(subCollision);
        collision.status = subCollision.status;
        collision.a = this.entity;
        collision.b = other;

        if (
          vec2.dot(a.shapeCollider.center, subCollision.normal) >
          vec2.dot(b.shapeCollider.center, subCollision.normal)
        ) {
          vec2.scale(subCollision.normal, subCollision.normal, -1);
        }

        vec2.add(collision.normal, collision.normal, subCollision.normal);

        if (subCollision.depth > collision.depth) {
          collision.depth = subCollision.depth;
        }
      }
    }

    return collision;
  }

  debug() {
    for (const rigidbody of this.decomposed) {
      rigidbody.shapeCollider.debug();
    }
  }
}
