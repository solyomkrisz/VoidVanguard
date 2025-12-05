import Projectile from "./Projectile.js";
import Spaceship from "./Spaceship.js";
import * as vec2 from "../common/vec2.js";
import { getAngleDiff } from "../common/common.js";
import * as mat2 from "../common/mat2.js";

export default class Enemy extends Spaceship {
  // prettier-ignore
  constructor({ game, model, x, y, maxSpeed } = {}) {
    super({ game, model, x, y, vx: 0, vy: 0, maxSpeed });
  }

  aim(targetPosition) {
    const _b = this.game.buffer;

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

  shoot(muzzle, at, projectileSpeed, cooldown) {
    const _b = this.game.buffer;

    this.aim(at.position); // Must aim before rotating the muzzle!

    vec2.rotate(muzzle, this.rotation); // muzzle = vec2_1
    vec2.add(muzzle, muzzle, this.position);

    const relativePosition = vec2.sub(_b.vec2_2, at.position, muzzle);

    const a = vec2.len(at.velocity) ** 2 - projectileSpeed ** 2;
    const b = 2 * vec2.dot(relativePosition, at.velocity);
    const c = vec2.len(relativePosition) ** 2;

    const disc = b * b - 4 * a * c;

    if (disc < 0) return;

    if (Math.abs(a) < 1e-7) return;

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
      game: this.game,
      x: muzzle[0],
      y: muzzle[1],
      vx: projectileSpeed,
      vy: projectileSpeed,
    });

    vec2.copy(projectile.forward, direction);
    projectile.rotation = this.rotation;

    this.game.projectiles.add(projectile);
    this.shootCooldown = cooldown;
  }

  update() {
    const dt = this.game.fdt;
    const _b = this.game.buffer;

    this.updateVelocity();
    this.updatePosition();

    if (this.shootCooldown <= 0) {
      const muzzle = vec2.set(_b.vec2_1, 0, 3);
      // this.shoot(muzzle, this.game.player, 5, 1);
    }

    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
  }

  onBroadCollision(other) {
    return true;
  }

  onNarrowCollision(other) {
    return true;
  }
}
