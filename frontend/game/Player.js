import Keyboard from "./Keyboard.js";
import Spaceship from "./Spaceship.js";
import Block from "./Block.js";
import * as vec2 from "../common/vec2.js";
import * as mat2 from "../common/mat2.js";
import Projectile from "./Projectile.js";
import Model from "./Model.js";

export default class Player extends Spaceship {
  constructor(game, model) {
    super({
      game,
      model: new Model(model),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      maxSpeed: 5,
    });
  }

  shoot(muzzle, projectileSpeed, cooldown) {
    vec2.rotate(muzzle, this.rotation);
    vec2.add(muzzle, muzzle, this.position);

    const projectile = new Projectile({
      game: this.game,
      x: muzzle[0],
      y: muzzle[1],
      vx: projectileSpeed,
      vy: projectileSpeed,
    });

    vec2.copy(projectile.forward, this.forward);
    projectile.rotation = this.rotation;

    this.game.projectiles.add(projectile);
    this.shootCooldown = cooldown;
  }

  // prettier-ignore
  update() {
    const dt = this.game.fdt;
    const _b = this.game.buffer;
    const activeControls = this.game.keyboard.activeControls;

    if (activeControls.has(Keyboard.KeyA)) {
      this.rotation += 2.5 * dt;
    }
    if (activeControls.has(Keyboard.KeyD)) {
      this.rotation -= 2.5 * dt;
    }

    const rotationMatrix = mat2.fromRotation(_b.mat2_1, this.rotation - this.previousRotation);
    vec2.transformMat2(this.forward, rotationMatrix, this.forward);
    vec2.normalize(this.forward, this.forward);

    if (activeControls.has(Keyboard.KeyW)) {
      _b.force_1.setFromMagDir(1000, this.forward);
      this.netForce.apply(_b.force_1);
    }
    if (activeControls.has(Keyboard.KeyS)) {
      _b.force_1.setFromMagDir(1000, this.forward).negate();
      this.netForce.apply(_b.force_1);
    }

    this.updateVelocity();
    this.updatePosition();

    if (this.shootCooldown <= 0 && activeControls.has(Keyboard.Space)) {
      const muzzle = vec2.set(_b.vec2_1, 0, 3);
      this.shoot(muzzle, 2, 1);
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
