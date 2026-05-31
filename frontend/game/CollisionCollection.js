/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/CollisionCollection.js
 * Szerep: Utkozesek gyujtemenye ujrafelhasznalhato elemekkel es iteracioval.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export default class CollisionCollection {
  constructor(game) {
    this.game = game;
    this.objects = [];
    this.toResolve = [];
    this.forContactPhase = [];
  }

  reset() {
    // Uj frame vagy uj iteracios kor elott minden gyujtolistat kiuritunk, de a tomboket ujrahasznaljuk.
    this.objects.length = 0;
    this.toResolve.length = 0;
    this.forContactPhase.length = 0;

    return this;
  }

  add(pair) {
    // Ide csak potencialis utkozo parok kerulnek, a tenyleges vizsgalat kesobb jon.
    this.objects.push(pair);
  }

  detect() {
    // Ebben a fazisban valik el, mely paroknal van valodi shape-utkozes, es ezek kozul melyek mehetnek tovabb a kontaktfázisba.
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
    // A kontaktfazis mar a kisebb alreszek szintjen hivja meg az objektumok onContact logikajat.
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
    // A resolve itt a mar osszegyujtott utkozeseken fut vegig, magat a matekot a Collision objektumok vegzik.
    for (const collision of this.toResolve) {
      collision.resolve();
    }

    return this;
  }

  iterate() {
    // Egyetlen frame-ben tobbszor is ujraszamolhatjuk az utkozeseket, hogy a sebesseg- es behatolascsokkentes stabilabb legyen.
    if (!this.objects.length) return this;

    let i = 0;
    let _continue = true;

    while (i < this.game.iterationCount && _continue) {
      _continue = false;

      this.detect().contact();

      for (const collision of this.toResolve) {
        collision.resolveVelocity();
        collision.resolvePenetration();
        _continue = true;
      }

      i++;
    }

    return this.reset();
  }
}
