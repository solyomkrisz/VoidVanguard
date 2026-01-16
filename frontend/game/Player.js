import Keyboard from "./Keyboard.js";
import Spaceship from "./Spaceship.js";
import * as vec2 from "../common/vec2.js";
import Projectile from "./Projectile.js";
import Model from "./Model.js";
import * as Type from "./Type.js";
import * as UI from "../ui/UI.js";
import _ from "../ui/component/ShipPropulsionPanel.js";
import _1 from "../ui/component/FlightComputer.js";
import BuildingBlock from "./BuildingBlock.js";

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

    this.updatePropulsion = this.manualPropulsionUpdate;

    this.createUI();
  }

  createUI() {
    const propulsionPanel = UI.element("ship-propulsion-panel");
    propulsionPanel.source = this;
    document.body.appendChild(propulsionPanel);

    const flightComputer = UI.element("flight-computer");
    flightComputer.source = this;
    document.body.appendChild(flightComputer);
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

  manualPropulsionUpdate(dt, _b, activeControls) {
    const _W = activeControls.has(Keyboard.KeyW);
    const _A = activeControls.has(Keyboard.KeyA);
    const _D = activeControls.has(Keyboard.KeyD);
    const _R = activeControls.has(Keyboard.KeyR);
    const _LCtrl = activeControls.has(Keyboard.LCtrl);
    const _LShift = activeControls.has(Keyboard.LShift);

    if (this.controlledThrusters.size > 0) {
      let T = 0;

      for (const thruster of this.controlledThrusters.values()) {
        _A && thruster.gimbal(-2.5 * dt);
        _D && thruster.gimbal(2.5 * dt);
        _LCtrl && thruster.setThrottle(-0.2 * dt);
        _LShift && thruster.setThrottle(0.2 * dt);
        _R && thruster.reset(-2.5 * dt);

        if (_W) {
          const thrustVector = vec2.rotate(
            vec2.copy(_b.vec2_1, thruster.getThrustVector()),
            this.rotation
          );
          this.netForce.apply(
            _b.force_1.setFromMagDir(thruster.getThrust(), thrustVector)
          );
          T += thruster.getTorque(this);
        }
      }

      this.angularAcceleration = T / this.I;
    }
  }

  autoPropulsionUpdate(dt, _b, activeControls) {
    const _W = activeControls.has(Keyboard.KeyW);
    const _A = activeControls.has(Keyboard.KeyA);
    const _D = activeControls.has(Keyboard.KeyD);
    const _R = activeControls.has(Keyboard.KeyR);
    const _LCtrl = activeControls.has(Keyboard.LCtrl);
    const _LShift = activeControls.has(Keyboard.LShift);

    if (this.controlledThrusters.size > 0) {
      let T = 0;

      for (const thruster of this.controlledThrusters.values()) {
        if (_A) thruster.gimbal(-2.5 * dt);
        if (_D) thruster.gimbal(2.5 * dt);
        if (!_A && !_D) thruster.reset();

        _LCtrl && thruster.setThrottle(-0.2 * dt);
        _LShift && thruster.setThrottle(0.2 * dt);
        _R && thruster.reset(-2.5 * dt);

        if (_W) {
          const thrustVector = vec2.rotate(
            vec2.copy(_b.vec2_1, thruster.getThrustVector()),
            this.rotation
          );
          this.netForce.apply(
            _b.force_1.setFromMagDir(thruster.getThrust(), thrustVector)
          );
          T += thruster.getTorque(this);
        }
      }

      this.angularAcceleration = T / this.I;
    }
  }

  update() {
    this.angularAcceleration = 0;

    const dt = this.game.fdt;
    const _b = this.game.buffer;
    const activeControls = this.game.keyboard.activeControls;

    this.updatePropulsion(dt, _b, activeControls);

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
  showDetails() {
    const ttip = this.game.tooltip;
    if (ttip.showTemplate(this, ttip.template.PARENT_INFO, this.game.frameId)) return;

    const t = ttip.template.PARENT_INFO;
    t.position.textContent = this.position;
    t.velocity.textContent = this.velocity;
    t.rotation.textContent = this.rotation;
    t.mass.textContent = this.mass;
    t.CoM.textContent = this.CoM;

    ttip.show();
  }

  onContact(object) {
    this.showDetails();
    object.showDetails(this);

    const mouse = this.game.mouse;

    // Detaching mechanism
    // prettier-ignore
    if (mouse.isDown && !mouse.dragged && object.isRemovable && object.health > 0) {
      const [ox, oy] = object.localPosition;

      let dirs = 0;

      // prettier-ignore
      for (const { localPosition: [x, y] } of this.model.objects) {
        if (ox + 1 === x && oy === y) dirs++;
        else if (ox - 1 === x && oy === y) dirs++;
        else if (ox === x && oy + 1 === y) dirs++;
        else if (ox === x && oy - 1 === y) dirs++;
      }

      if (dirs >= 4) return;

      const [px, py] = this.position;

      const bblock = new BuildingBlock({
        game: this.game,
        model: new Model([object], Model.COPY_MODE.PRESERVE),
        x: px + ox,
        y: py + oy,
      });

      const originalHealth = object.health;

      object.onRemove = function () {
        this.health = originalHealth;

        this.onRemove = function (parent) {
          return this;
        };
      };

      vec2.copy(bblock.position, this.game.mouse.position);

      this.game.buildingBlocks.add(bblock);

      object.health = 0;
    }
  }
}
