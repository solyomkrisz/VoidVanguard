export default class CollisionCollection {
  constructor(game) {
    this.game = game;
    this.objects = [];
    this.collisions = [];
  }

  reset() {
    this.objects.length = 0;
    this.collisions.length = 0;

    return this;
  }

  add(pair) {
    this.objects.push(pair);
  }

  detect() {
    for (const [a, b] of this.objects) {
      a.shapeCollider.validate();
      b.shapeCollider.validate();

      const collision = a.shapeCollider.intersects(b);

      if (!collision.status) continue;

      const passA = a.onNarrowCollision(b);
      const passB = b.onNarrowCollision(a);

      passA && passB && this.collisions.push(collision);
    }

    return this;
  }

  // prettier-ignore
  contact() {
    for (const { subCollisions } of this.collisions) {
      for (const { a, b } of subCollisions) {
        a.contactCollider.validate();
        b.contactCollider.validate();

        const collision = a.contactCollider.intersects(b, (b) => b.contactCollider);

        if (!collision.status) continue;

        for (const { a: { model: { objects: [_a] } }, b: { model: { objects: [_b] } } } of collision.subCollisions) {
          a.parent.onContact(_a);
          b.parent.onContact(_b);
        }
      }
    }

    return this;
  }

  resolve() {
    for (const collision of this.collisions) {
      collision.resolve();
    }

    return this.reset();
  }
}
