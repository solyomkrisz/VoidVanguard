export default class CollisionCollection {
  constructor(game) {
    this.game = game;
    this.objects = [];
    this.toResolve = [];
    this.forContactPhase = [];
  }

  reset() {
    this.objects.length = 0;
    this.toResolve.length = 0;
    this.forContactPhase.length = 0;

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

      this.toResolve.push(collision);

      const passA = a.onNarrowCollision(b);
      const passB = b.onNarrowCollision(a);

      passA && passB && this.forContactPhase.push(collision);
    }

    return this;
  }

  // prettier-ignore
  contact() {
    for (const { subCollisions } of this.forContactPhase) {
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
    for (const collision of this.toResolve) {
      collision.resolve();
    }

    return this.reset();
  }
}
