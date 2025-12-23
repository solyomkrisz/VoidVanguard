import Keyboard from "./Keyboard.js";
import Spaceship from "./Spaceship.js";
import * as vec2 from "../common/vec2.js";
import Projectile from "./Projectile.js";
import Model from "./Model.js";
import * as Type from "./Type.js";
import * as UI from "../ui/UI.js";
import _ from "../ui/component/ShipPropulsionPanel.js";

export default class Player extends Spaceship {
  constructor(game, model) {
    super({
      type: Type.PLAYER,
      game,
      model: new Model(model),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      maxSpeed: 5,
    });

    this.createUI();
  }

  createUI() {
    const propulsionPanel = UI.element("ship-propulsion-panel");
    propulsionPanel.source = this;
    document.body.appendChild(propulsionPanel);
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
    this.angularAcceleration = 0;

    const dt = this.game.fdt;
    const _b = this.game.buffer;
    const activeControls = this.game.keyboard.activeControls;
    console.log(activeControls)

    const _W = activeControls.has(Keyboard.KeyW);
    const _A = activeControls.has(Keyboard.KeyA);
    const _D = activeControls.has(Keyboard.KeyD);
    const _R = activeControls.has(Keyboard.KeyR);
    const _LCtrl = activeControls.has(Keyboard.LCtrl);
    const _LShift = activeControls.has(Keyboard.LShift);

    if (this.controlledThrusters.size > 0) {
      let T = 0;

      for (const thruster of this.controlledThrusters.values()) {
        _A && thruster.gimbal(2.5 * dt);
        _D && thruster.gimbal(-2.5 * dt);
        _LCtrl && thruster.setThrottle(-0.2 * dt);
        _LShift && thruster.setThrottle(0.2 * dt);
        _R && thruster.reset(-2.5 * dt);

        if (_W) {
          const thrustVector = vec2.rotate(
            vec2.copy(_b.vec2_1, thruster.thrustVector),
            this.rotation
          );
          this.netForce.apply(
            _b.force_1.setFromMagDir(thruster.getThrust(), thrustVector).negate()
          );
          T += thruster.getTorque(this);
        }
      }

      this.angularAcceleration = T / this.I;
    }

    this.updateVelocity();
    this.updatePosition();

    this.updateAngularVelocity();
    this.updateRotation();

    if (this.shootCooldown <= 0 && activeControls.has(Keyboard.Space)) {
      const muzzle = vec2.set(_b.vec2_1, 0, 3);
      this.shoot(muzzle, 2, 1);
    }

    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
  }

  onPositionChange() {
    this.proxyCollider.onPositionChange();
    this.shapeCollider.onPositionChange();
  }

  onBroadCollision(other) {
    return true;
  }

  onNarrowCollision(other) {
    return true;
  }

  // prettier-ignore
  onContact(object) {
    object.showDetailsOnContact(this);
    // object.health = 0;
    // this.model.clear();
    // this.proxyCollider.onGeometryChange();
    // this.shapeCollider.onGeometryChange();
  }
}
