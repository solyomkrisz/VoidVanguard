export default class CollisionCollection {
  constructor(game) {
    this.game = game;
    this.objects = [];
    this.collisions = [];
  }

  reset() {
    this.objects.length = 0;
  }

  add(pair) {
    this.objects.push(pair);
  }

  detect() {
    this.collisions.length = 0;

    for (const [a, b] of this.objects) {
      a.shapeCollider.validate();
      b.shapeCollider.validate();

      const collision = a.shapeCollider.intersects(b);

      if (collision.status) {
        const passA = a.onNarrowCollision(b);
        const passB = b.onNarrowCollision(a);

        passA && passB && this.collisions.push(collision);
      }
    }

    return this;
  }

  resolve() {
    for (const collision of this.collisions) {
      collision.resolve();
    }
  }
}
