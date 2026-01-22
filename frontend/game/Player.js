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
import { General2DCanvas as G2D } from "./General2DCanvas.js";

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

    this.UI = {};

    // Creating UI
    // prettier-ignore
    {
      this.UI.propulsionPanel = UI.element("ship-propulsion-panel").setSource(this).insertInto();
      this.UI.flightComputer = UI.element("flight-computer").setSource(this).insertInto();
    }

    this.updatePropulsion = this.manualPropulsionUpdate;

    this.model.init(this);

    this.updateStatusDiagram();
  }

  onGeometryChange() {
    this.proxyCollider.onGeometryChange();
    this.shapeCollider.onGeometryChange();

    this.setMassAndCoM();
    this.setMomentOfInertia();

    this.updateStatusDiagram();
  }

  updateStatusDiagram() {
    G2D.setSize(600, 300).setTileSize(2);
    G2D.fillRect("#111", 0, 0, G2D.W, G2D.H);

    // prettier-ignore
    for (const object of this.model.objects) {
      const vertices = object.shape.vertices, n = vertices.length;
      const [tx, ty] = object.localPosition;

      G2D.beginPath();
      G2D.moveTo(vertices[0] + tx, vertices[1] + ty, true);

      for (let i = 2; i < n; i += 2) {
        const x = vertices[i % n];
        const y = vertices[(i + 1) % n];

        G2D.lineTo(x + tx, y + ty, true);
      }

      G2D.closePath();
      G2D.stroke("#fff", G2D.toResponsive(0.06));

      G2D.fillCircle("lightblue", this.CoM[0], this.CoM[1], 0.2, 0, Math.PI * 2, true);
    }

    this.UI.flightComputer.statusDiagram.set(G2D.canvas, "image/jpeg", 1.0);
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
            this.rotation,
          );
          this.netForce.apply(
            _b.force_1.setFromMagDir(thruster.getThrust(), thrustVector),
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
            this.rotation,
          );
          this.netForce.apply(
            _b.force_1.setFromMagDir(thruster.getThrust(), thrustVector),
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

  // prettier-ignore
  detachBlock(object) {
    const mouse = this.game.mouse;

    if (mouse.isDown && !mouse.dragged && object.isRemovable && !object.toRemove) {
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

      object.toRemove = true;

      vec2.copy(bblock.position, this.game.mouse.position);

      this.game.buildingBlocks.add(bblock);
    }
  }

  onContact(collision, object) {
    if (collision.is(Type.INTERACTION)) {
      if (this.game.mouse.isDown) {
        this.detachBlock(object);
        return;
      }

      this.showDetails();
      object.showDetails(this);
    }
  }

  // prettier-ignore
  resolvePenetration(other, collision, epsilon, direction) {
    if (other.is(Type.BUILDING_BLOCK)) return;

    vec2.addScaled(this.position, this.position, collision.normal, this.getDefaultPenetrationCorrection(other, collision, epsilon) * direction);
  }
}
