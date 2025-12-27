import Block from "./Block.js";
import * as vec2 from "../common/vec2.js";
import DynamicTooltip from "../ui/component/DynamicTooltip.js";

export default class Thruster extends Block {
  static g0 = 9.81;
  static LISTED_PROPERTIES = ["thrustVector", "_gimbal", "throttle", "Isp"];

  constructor({
    x,
    y,
    shape,
    spriteId,
    mass = 1,
    description = null,
    fuelType,
    Isp,
    massFlowRate,
    hasGimbal = false,
    gimbalRange = 0,
  } = {}) {
    super(x, y, shape, spriteId, mass);

    this.id = null;
    this.description = description;
    this.fuelType = fuelType;
    this.Isp = Isp;
    this.massFlowRate = massFlowRate;
    this.defaultThrustVector = vec2.fromValues(0, -1);
    this.thrustVector = vec2.fromValues(0, -1);
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

  onRemove(parent) {
    parent.idManager.release(this.id);
    parent.thrusters.delete(this.id);
    this.controller.remove();
    return this;
  }

  onInsert(parent) {
    this.id = parent.idManager.get();
    parent.thrusters.set(this.id, this);
    return this;
  }

  reset() {
    vec2.copy(this.thrustVector, this.defaultThrustVector);
    this._gimbal = 0;
    this.throttle = 1;

    // prettier-ignore
    {
      this.controller.thrustVector.textContent = `[${this.thrustVector[0].toFixed(4)}, ${this.thrustVector[1].toFixed(4)}]`;
      this.controller._gimbal.textContent = this._gimbal.toFixed(4);
      this.controller.throttle.textContent = this.throttle.toFixed(4);
    }

    this.dirty = true;
  }

  gimbal(da) {
    if (!this.hasGimbal) return this;

    this._gimbal = Math.max(
      -this.gimbalRange,
      Math.min(this.gimbalRange, (this._gimbal += da))
    );

    if (this._gimbal === this.previousGimbal) return;

    vec2.copy(this.thrustVector, this.defaultThrustVector);

    vec2.rotate(this.thrustVector, this._gimbal * (Math.PI / 180));
    this.previousGimbal = this._gimbal;

    // prettier-ignore
    {
      this.controller.thrustVector.textContent = `[${this.thrustVector[0].toFixed(4)}, ${this.thrustVector[1].toFixed(4)}]`;
      this.controller._gimbal.textContent = this._gimbal.toFixed(4);
    }

    this.dirty = true;

    return this;
  }

  getExhaustVelocity() {
    return this.Isp * Thruster.g0;
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

    const F = vec2.scale(_b.vec2_1, vec2.copy(_b.vec2_1, this.thrustVector), this.getThrust());
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
