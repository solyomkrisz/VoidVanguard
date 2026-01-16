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
    this.toResolve.length = 0;
    this.forContactPhase.length = 0;

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

        for (const subCollision of collision.subCollisions) {
          a.parent.onContact(subCollision, ...subCollision.a.model.objects);
          b.parent.onContact(subCollision, ...subCollision.b.model.objects);
        }
      }
    }

    return this;
  }

  resolve() {
    for (const collision of this.toResolve) {
      collision.resolve();
    }

    return this;
  }

  iterate() {
    if (!this.objects.length) return this;

    let i = 0;
    let _continue = true;

    while (i < this.game.iterationCount && _continue) {
      _continue = false;

      this.detect().contact();

      for (const collision of this.toResolve) {
        collision.resolvePenetration();
        _continue = true;
      }

      i++;
    }

    return this.reset();
  }
}
