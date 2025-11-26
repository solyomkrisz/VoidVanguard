import Projectile from "./Projectile.js";
import Spaceship from "./Spaceship.js";
import * as vec2 from "../common/vec2.js";
import { getAngleDiff } from "../common/common.js";
import * as mat2 from "../common/mat2.js";

export default class Enemy extends Spaceship {
  // prettier-ignore
  constructor({ model, x, y } = {}) {
    super({ model, x, y, vx: 0, vy: 0 });
  }

  aim(game, targetPosition) {
    const _b = game.buffer;

    const toTarget = vec2.create();
    vec2.sub(toTarget, targetPosition, this.position);

    if (vec2.len(toTarget) === 0) return;

    vec2.normalize(toTarget, toTarget);

    const rotation = Math.atan2(toTarget[1], toTarget[0]) - Math.PI / 2;
    this.rotation =
      this.previousRotation + getAngleDiff(rotation, this.previousRotation);

    mat2.fromRotation(_b.mat2_1, this.rotation);

    vec2.set(this.forward, 0, 1);
    vec2.transformMat2(this.forward, _b.mat2_1, this.forward);
    vec2.normalize(this.forward, this.forward);
  }

  shoot(game, muzzle, at, projectileSpeed, cooldown) {
    const _b = game.buffer;

    this.aim(game, at.position); // Must aim before rotating the muzzle!

    vec2.rotate(muzzle, this.rotation); // muzzle = vec2_1
    vec2.add(muzzle, muzzle, this.position);

    const relativePosition = vec2.sub(_b.vec2_2, at.position, muzzle);

    const a = vec2.len(at.velocity) ** 2 - projectileSpeed ** 2;
    const b = 2 * vec2.dot(relativePosition, at.velocity);
    const c = vec2.len(relativePosition) ** 2;

    const disc = b * b - 4 * a * c;

    if (disc < 0) return;

    if (Math.abs(a) < 0.0000001) return;

    const discSqrt = Math.sqrt(disc);
    const denom = 2 * a;

    const x1 = (-b - discSqrt) / denom;
    const x2 = (-b + discSqrt) / denom;

    let t = Math.min(x1, x2);
    if (t < 0) t = Math.max(x1, x2);
    if (t < 0) return;

    const atVelocity = vec2.copy(_b.vec2_2, at.velocity);
    const distance = vec2.scale(atVelocity, atVelocity, t);
    const futurePosition = vec2.add(distance, distance, at.position);

    const direction = vec2.sub(futurePosition, futurePosition, muzzle);
    vec2.normalize(direction, direction);

    const projectile = new Projectile({
      x: muzzle[0],
      y: muzzle[1],
      vx: projectileSpeed,
      vy: projectileSpeed,
    });

    vec2.copy(projectile.forward, direction);
    projectile.rotation = this.rotation;

    game.projectiles.push(projectile);
    this.shootCooldown = cooldown;
  }

  update(game, dt) {
    const _b = game.buffer;

    if (this.shootCooldown <= 0) {
      const muzzle = vec2.set(_b.vec2_1, 0, 3);
      // this.shoot(game, muzzle, game.player, 5, 1);
    }

    this.shootCooldown = Math.max(0, this.shootCooldown - dt);

    if (!vec2.isEqual(this.previousPosition, this.position)) {
      this.proxyCollider.onPositionChange();
    }
  }
}
