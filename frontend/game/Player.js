import Keyboard from "/game/Keyboard.js";
import Spaceship from "/game/Spaceship.js";
import Block from "/game/Block.js";
import BlockStyle from "/game/BlockStyle.js";
import * as vec2 from "/common/vec2.js";
import Projectile from "/game/Projectile.js";
import Model from "/game/Model.js";
import * as Type from "/game/Type.js";
import * as UI from "/ui/UI.js";
import _ from "/ui/component/game/ShipPropulsionPanel.js";
import _1 from "/ui/component/game/FlightComputer.js";
import BuildingBlock from "/game/BuildingBlock.js";
import EngineIgnitionController from "/ui/component/game/EngineIgnitionController.js";
import EngineThrottleController from "/ui/component/game/EngineThrottleController.js";
import ThrustVectorController from "/ui/component/game/ThrustVectorController.js";

export default class Player extends Spaceship {
  constructor(game, model) {
    super({
      type: Type.PLAYER,
      game,
      model,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      maxSpeed: 5,
    });

    this.score = 0;
    this.scoreTimer = 3;

    this.chunk = vec2.create();
    this.setCurrentChunk();

    this.UI = {};

    // Creating UI
    // prettier-ignore
    {
      this.UI.propulsionPanel = UI.element("ship-propulsion-panel").setSource(this);
      this.UI.flightComputer = UI.element("flight-computer").setSource(this);

      const controllerContainer = this.game.UI.controllerContainer;

      if (controllerContainer) {
        controllerContainer.appendShadowChild?.(this.UI.propulsionPanel);
        controllerContainer.appendShadowChild?.(this.UI.flightComputer);
      }
    }

    this.updatePropulsion = this.manualPropulsionUpdate;

    this.model.init(this);

    this.sounds = new Map();
  }

  setSound(name, source, options = {}) {
    this.sounds.set(name, {
      sound: this.game.audioManager.createSound(source, {
        ...options,
      }),
      isPlaying: false,
    });
  }

  playSound(name) {
    const sound = this.sounds.get(name);
    if (!sound || sound.isPlaying) return;
    sound.sound.start();
    sound.isPlaying = true;
  }

  stopSound(name) {
    const sound = this.sounds.get(name);
    if (!sound || !sound.isPlaying) return;
    sound.sound.stop();
    console.log("SOUND STOPPED");
    sound.isPlaying = false;
  }

  destroy() {
    for (const key of Object.keys(this.UI)) {
      this.UI[key].remove?.();
    }
  }

  exportSave() {
    return {
      score: this.score,
      state: [...this.state],
      position: [...this.position],
      rotation: this.rotation,
      model: this.model.exportSave(),
    };
  }

  from(savedState) {
    this.score = savedState.score;
    this.state = new Uint32Array(savedState.state);
    this.position = vec2.clone(savedState.position);
    this.rotation = savedState.rotation;
    this.model.from(savedState.model);

    this.setMassAndCoM();
    this.setMomentOfInertia();
  }

  // prettier-ignore
  setCurrentChunk() {
    this.chunk[0] = Math.floor(this.position[0] / this.game.chunkSize / this.game.backgroundZoom);
    this.chunk[1] = Math.floor(this.position[1] / this.game.chunkSize / this.game.backgroundZoom);
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
    const _W =
      activeControls.has(Keyboard.KeyW) ||
      activeControls.has(EngineIgnitionController.IGNITE);

    const _A =
      activeControls.has(Keyboard.KeyA) ||
      activeControls.has(ThrustVectorController.GIMBAL_LEFT);

    const _D =
      activeControls.has(Keyboard.KeyD) ||
      activeControls.has(ThrustVectorController.GIMBAL_RIGHT);

    const _R =
      activeControls.has(Keyboard.KeyR) ||
      activeControls.has(ThrustVectorController.GIMBAL_RESET);

    const _LCtrl =
      activeControls.has(Keyboard.LCtrl) ||
      activeControls.has(EngineThrottleController.THROTTLE_DOWN);

    const _LShift =
      activeControls.has(Keyboard.LShift) ||
      activeControls.has(EngineThrottleController.THROTTLE_UP);

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

          this.playSound("enginesound");
        } else {
          this.stopSound("enginesound");
        }
      }

      this.angularAcceleration = T / this.I;
    } else {
      this.stopSound("enginesound");
    }
  }

  autoPropulsionUpdate(dt, _b, activeControls) {
    const _W =
      activeControls.has(Keyboard.KeyW) ||
      activeControls.has(EngineIgnitionController.IGNITE);

    const _A =
      activeControls.has(Keyboard.KeyA) ||
      activeControls.has(ThrustVectorController.GIMBAL_LEFT);

    const _D =
      activeControls.has(Keyboard.KeyD) ||
      activeControls.has(ThrustVectorController.GIMBAL_RIGHT);

    const _R =
      activeControls.has(Keyboard.KeyR) ||
      activeControls.has(ThrustVectorController.GIMBAL_RESET);

    const _LCtrl =
      activeControls.has(Keyboard.LCtrl) ||
      activeControls.has(EngineThrottleController.THROTTLE_DOWN);

    const _LShift =
      activeControls.has(Keyboard.LShift) ||
      activeControls.has(EngineThrottleController.THROTTLE_UP);

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

          this.playSound("enginesound");
        } else {
          this.stopSound("enginesound");
        }
      }

      this.angularAcceleration = T / this.I;
    } else {
      this.stopSound("enginesound");
    }
  }

  update() {
    this.angularAcceleration = 0;

    const dt = this.game.fdt;
    const _b = this.game.buffer;
    const activeControls = this.game.activeControls;

    this.updatePropulsion(dt, _b, activeControls);

    this.updateVelocity();
    this.updatePosition();

    this.updateAngularVelocity();
    this.updateRotation();

    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.scoreTimer = Math.max(0, this.scoreTimer - dt);

    if (this.shootCooldown <= 0 && activeControls.has(Keyboard.Space)) {
      const muzzle = vec2.set(_b.vec2_1, 0, 3);
      this.shoot(muzzle, 2, 1);
    }

    if (this.scoreTimer <= 0) {
      this.score++;
      this.scoreTimer = 3;
      console.log("PLAYER SCORE: ", this.score);
    }
  }

  onPositionChange() {
    this.proxyCollider.onPositionChange();
    this.shapeCollider.onPositionChange();

    this.setCurrentChunk();
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
