import Block from "/game/Block.js";
import Shape from "/game/Shape.js";
import * as vec from "/common/vec.js";
import * as vec2 from "/common/vec2.js";
import * as Type from "/game/Type.js";
import * as UI from "/ui/UI.js";
import _ from "/ui/component/game/ThrusterController.js";

export default class Thruster extends Block {
  static g0 = 9.81;

  // prettier-ignore
  static LISTED_PROPERTIES = ["localPosition", "exhaustDirection", "_gimbal", "throttle", "Isp"];

  static from(thrusterState) {
    const [x, y] = thrusterState.localPosition;
    const shape = Shape.from(thrusterState.shape);

    const thruster = new Thruster({
      x,
      y,
      shape,
      spriteID: thrusterState.spriteID,
      mass: thrusterState.mass,
      health: thrusterState.health,
      adjacencyRules: vec.clone(thrusterState.adjacencyRules),
      description: thrusterState.description,
      fuelType: thrusterState.fuelType,
      Isp: thrusterState.Isp,
      massFlowRate: thrusterState.massFlowRate,
      hasGimbal: thrusterState.hasGimbal,
      gimbalRange: thrusterState.gimbalRange,
    });

    return thruster;
  }

  constructor({
    x,
    y,
    shape,
    spriteID,
    mass = 1,
    health = 100,
    adjacencyRules = vec.create(0),
    description = null,
    fuelType = null,
    Isp,
    massFlowRate,
    hasGimbal = false,
    gimbalRange = 0,
  } = {}) {
    super({ x, y, shape, spriteID, mass, health, adjacencyRules });
    this.type = Type.THRUSTER; // for recovery from saves

    this.id = null;
    this.description = description;
    this.fuelType = fuelType;
    this.Isp = Isp;
    this.massFlowRate = massFlowRate;
    this.defaultExhaustDirection = vec2.fromValues(0, -1);
    this.exhaustDirection = vec2.fromValues(0, -1);
    this.thrustVector = vec2.fromValues(0, 1);
    this.thrust = 0;
    this.hasGimbal = hasGimbal;
    this.gimbalRange = gimbalRange;
    this._gimbal = 0;
    this.previousGimbal = 0;
    this.throttle = 1;
    this.torque = 0;
    this.dirty = true;
    this.controller = null;
  }

  clone(thruster) {
    const newThruster = new Thruster({
      x: thruster.localPosition[0],
      y: thruster.localPosition[1],
      shape: thruster.shape,
      spriteID: thruster.spriteID,
      mass: thruster.mass,
      health: thruster.health,
      adjacencyRules: vec.clone(thruster.adjacencyRules),
    });

    newThruster.id = thruster.id;
    newThruster.description = thruster.description;
    newThruster.Isp = thruster.Isp;
    newThruster.massFlowRate = thruster.massFlowRate;
    newThruster.defaultExhaustDirection = vec2.clone(
      thruster.defaultExhaustDirection,
    );
    newThruster.thrustVector = vec2.clone(thruster.thrustVector);
    newThruster.thrust = thruster.thrust;
    newThruster.hasGimbal = thruster.hasGimbal;
    newThruster.gimbalRange = thruster.gimbalRange;
    newThruster._gimbal = thruster._gimbal;
    newThruster.previousGimbal = thruster.previousGimbal;
    newThruster.throttle = thruster.throttle;
    newThruster.torque = thruster.torque;
    newThruster.dirty = thruster.dirty;
    newThruster.controller = null;

    return newThruster;
  }

  exportSave() {
    return {
      ...super.exportSave(),
      // id: this.id,
      description: this.description,
      fuelType: this.fuelType,
      Isp: this.Isp,
      massFlowRate: this.massFlowRate,
      hasGimbal: this.hasGimbal,
      gimbalRange: this.gimbalRange,
    };
  }

  onRemove(parent) {
    this.toRemove = false;

    if (parent.is(Type.PLAYER)) {
      parent.thrusters.delete(this.id);
      parent.controlledThrusters.delete(this.id);
      console.log(parent.controlledThrusters);
      parent.idManager.release(this.id);
      this.id = null;
      if (this.controller) {
        this.controller.remove();
        this.controller.toggleCheckbox();
      }
    }

    return this;
  }

  // prettier-ignore
  onInsert(parent) {
    this.dirty = true; // Lehet, hogy új localPosition-t kapott szóval a nyomatékot újra kell számolni!

    if (parent.is(Type.PLAYER)) {
      !this.controller && (this.controller = UI.element("thruster-controller").setSource(this)).build();
      parent.UI.propulsionPanel.dispatchEvent(
        new CustomEvent("thruster-insert", {
          detail: {
            thruster: this,
          },
          bubbles: true,
          composed: true,
        }),
      );
      this.id = parent.idManager.get();
      parent.thrusters.set(this.id, this);
    }

    return this;
  }

  reset() {
    vec2.copy(this.exhaustDirection, this.defaultExhaustDirection);
    this._gimbal = 0;
    this.throttle = 1;

    // prettier-ignore
    {
      this.controller.exhaustDirection.textContent = `[${this.exhaustDirection[0].toFixed(4)}, ${this.exhaustDirection[1].toFixed(4)}]`;
      this.controller._gimbal.textContent = this._gimbal.toFixed(4);
      this.controller.throttle.textContent = this.throttle.toFixed(4);
    }

    this.dirty = true;
  }

  gimbal(da) {
    if (!this.hasGimbal) return this;

    this._gimbal = Math.max(
      -this.gimbalRange,
      Math.min(this.gimbalRange, (this._gimbal += da)),
    );

    if (this._gimbal === this.previousGimbal) return;

    vec2.copy(this.exhaustDirection, this.defaultExhaustDirection);

    vec2.rotate(this.exhaustDirection, this._gimbal * (Math.PI / 180));
    this.previousGimbal = this._gimbal;

    // prettier-ignore
    {
      this.controller.exhaustDirection.textContent = `[${this.exhaustDirection[0].toFixed(4)}, ${this.exhaustDirection[1].toFixed(4)}]`;
      this.controller._gimbal.textContent = this._gimbal.toFixed(4);
    }

    this.dirty = true;

    return this;
  }

  reset() {
    this._gimbal = 0;

    if (this._gimbal === this.previousGimbal) return;

    vec2.copy(this.exhaustDirection, this.defaultExhaustDirection);

    vec2.rotate(this.exhaustDirection, this._gimbal * (Math.PI / 180));
    this.previousGimbal = this._gimbal;

    // prettier-ignore
    {
      this.controller.exhaustDirection.textContent = `[${this.exhaustDirection[0].toFixed(4)}, ${this.exhaustDirection[1].toFixed(4)}]`;
      this.controller._gimbal.textContent = this._gimbal.toFixed(4);
    }

    this.dirty = true;
  }

  getExhaustVelocity() {
    return this.Isp * Thruster.g0;
  }

  getThrustVector() {
    vec2.copy(this.thrustVector, this.exhaustDirection);
    vec2.scale(this.thrustVector, this.thrustVector, -1);

    return this.thrustVector;
  }

  getThrust() {
    if (!this.dirty) return this.thrust;

    this.thrust = this.massFlowRate * this.getExhaustVelocity() * this.throttle;

    return this.thrust;
  }

  setThrottle(diff) {
    this.throttle = Math.min(1, Math.max(0, this.throttle + diff));
    this.controller.throttle.textContent = this.throttle.toFixed(4);
    this.dirty = true;

    return this;
  }

  getFuelConsumption(dt) {
    return this.massFlowRate * this.throttle * dt;
  }

  // prettier-ignore
  getTorque(parent) {
    if (!this.dirty) return this.torque;

    const _b = parent.game.buffer;

    const F = vec2.scale(_b.vec2_1, vec2.copy(_b.vec2_1, this.getThrustVector()), this.getThrust());
    const r = vec2.sub(_b.vec2_2, this.localPosition, parent.CoM);
    this.torque = r[0] * F[1] - r[1] * F[0];

    this.dirty = false;

    return this.torque;
  }

  update() {
    if (!this.dirty) return this;
  }

  // prettier-ignore
  showSpecificDetails(parent) {
    const ttip = parent.game.tooltip;
    if (ttip.showTemplate(this, ttip.template.THRUSTER_INFO, parent.game.frameId) && !this.dirty) return;

    const t = ttip.template.THRUSTER_INFO;
    t.Isp.textContent = this.Isp;
    t.massFlowRate.textContent = this.massFlowRate;
    t.hasGimbal.textContent = this.hasGimbal;
    t._gimbal.textContent = this._gimbal;
    t.throttle.textContent = this.throttle;
  }

  showDetails(parent) {
    this.showBasicDetails(parent);
    this.showSpecificDetails(parent);
    parent.game.tooltip.show();
  }
}
