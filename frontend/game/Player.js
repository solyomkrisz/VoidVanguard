import Keyboard from "./Keyboard.js";
import Spaceship from "./Spaceship.js";
import Block from "./Block.js";
import * as vec2 from "../common/vec2.js";
import * as mat2 from "../common/mat2.js";
import { TextureID, SpriteID } from "./texture/Texture.js";
import Projectile from "./Projectile.js";

export default class Player extends Spaceship {
  static MODEL = [
    new Block(0, 0, SpriteID.TEST),
    new Block(-1, 0, SpriteID.TEST),
    new Block(1, 0, SpriteID.TEST),
    new Block(0, 1, SpriteID.TEST),
  ];

  constructor() {
    super({ model: Player.MODEL, x: 0, y: 0, vx: 0, vy: 0 });
  }

  shoot(game, muzzle, projectileSpeed, cooldown) {
    vec2.rotate(muzzle, this.rotation);
    vec2.add(muzzle, muzzle, this.position);

    const projectile = new Projectile({
      x: muzzle[0],
      y: muzzle[1],
      vx: projectileSpeed,
      vy: projectileSpeed,
    });

    vec2.copy(projectile.forward, this.forward);
    projectile.rotation = this.rotation;

    game.projectiles.push(projectile);
    this.shootCooldown = cooldown;
  }

  // prettier-ignore
  update(game, dt) {
    const _b = game.buffer;
    const activeControls = game.keyboard.activeControls;
    vec2.set(_b.vec2_1, 5, 5);
    vec2.mul(_b.vec2_1, _b.vec2_1, this.forward);

    if (activeControls.has(Keyboard.KeyA)) {
      this.rotation += 2.5 * dt;
    }
    if (activeControls.has(Keyboard.KeyD)) {
      this.rotation -= 2.5 * dt;
    }

    const rotationMatrix = mat2.fromRotation(_b.mat2_1, this.rotation - this.previousRotation);
    vec2.transformMat2(this.forward, rotationMatrix, this.forward);
    vec2.normalize(this.forward, this.forward);

    let isControlled = false;

    if (activeControls.has(Keyboard.KeyW)) {
      vec2.copy(this.velocity, _b.vec2_1);
      vec2.addScaled(this.position, this.position, _b.vec2_1, dt);
      isControlled = true;
    }
    if (activeControls.has(Keyboard.KeyS)) {
      vec2.scale(_b.vec2_1, _b.vec2_1, -1);
      vec2.copy(this.velocity, _b.vec2_1);
      vec2.addScaled(this.position, this.position, _b.vec2_1, dt);
      isControlled = true;
    }

    if (!isControlled) vec2.reset(this.velocity);

    if (this.shootCooldown <= 0 && activeControls.has(Keyboard.Space)) {
      const muzzle = vec2.set(_b.vec2_1, 0, 3);
      this.shoot(game, muzzle, 2, 1);
    }

    this.shootCooldown = Math.max(0, this.shootCooldown - dt);

    if (!vec2.isEqual(this.previousPosition, this.position)) {
      this.proxyCollider.onPositionChange();
    }
  }
}
