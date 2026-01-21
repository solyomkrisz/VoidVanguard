import Block from "./Block.js";
import * as vec from "../common/vec.js";
import * as vec2 from "../common/vec2.js";
import * as Type from "./Type.js";
import * as UI from "../ui/UI.js";
import _ from "../ui/component/ThrusterController.js";
import { General2DCanvas as G2D } from "./General2DCanvas.js";
import { LERP } from "../common/common.js";

export default class Thruster extends Block {
  static g0 = 9.81;

  // prettier-ignore
  static LISTED_PROPERTIES = ["id", "localPosition", "exhaustDirection", "_gimbal", "throttle", "Isp"];

  static MAX_GIMBAL_RANGE = 15; // degrees

  constructor({
    x,
    y,
    shape,
    spriteId,
    mass = 1,
    health = 100,
    adjacencyRules = vec.create(0),
    description = null,
    fuelType,
    Isp,
    massFlowRate,
    hasGimbal = false,
    gimbalRange = 0,
  } = {}) {
    super({ x, y, shape, spriteId, mass, health, adjacencyRules });

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

  // prettier-ignore
  updateGimbalDiagram() {
    G2D.setSize(50, 50).setTileSize(1);
    G2D.fillRect("#111", 0, 0, G2D.W, G2D.H);

    const d = this._gimbal * (Math.PI / 180);
    const r = Thruster.MAX_GIMBAL_RANGE * (Math.PI / 180);

    let
      sx = 0, sy = 1,
      ex = 0, ey = -0.5,
      px = 0, py = ey - (ex * Math.cos(r) - 1) / Math.sin(r);

    const l = Math.hypot(ex - sx, ey - sy);
    const c = Math.cos(d), s = Math.sin(d);
    const rx = (ex - px) * c - (ey - py) * s + px; // rotated end x
    // const ry = (ex - px) * s + (ey - py) * c + py; // rotated end y
    // prettier-ignore
    // const ry = sy + Math.sign(ey - sy) * Math.sqrt(l * l - (rx - sx) * (rx - sx));

    G2D.fillTriangle("#999", 0, 1, rx, ey, 0, ey, true); // triangle
    G2D.line("#555", 2, -1, ey, 1, ey, true); // horizontal axis
    G2D.line("#555", 2, 0, 1, 0, ey, true); // vertical axis
    G2D.line("#fff", 2, sx, sy, rx, ey, true); // gimbal line

    G2D.setFontFamily("Arial").setFontSize(G2D.toResponsive(0.5)).setTextAlignment("center");
    G2D.fillText(0, -1 + 0.01, this._gimbal.toFixed(3) + "°", "#fff", true);

    this.controller.gimbalDiagram.set(G2D.canvas, "image/jpeg", 1.0);
  }

  // prettier-ignore
  updateThrottleDiagram() {
    G2D.setSize(50, 50);
    G2D.fillRect("#111", 0, 0, G2D.W, G2D.H);

    const rad = LERP(Math.PI, 0, this.throttle);

    const sx = 0, sy = -0.5;
    const ex = 0.9, ey = -0.5;
    const rx = (ex - sx) * Math.cos(rad) - (ey - sy) * Math.sin(rad) + sx;
    const ry = (ex - sx) * Math.sin(rad) + (ey - sy) * Math.cos(rad) + sy;

    G2D.line("#555", 1, -1, -0.5, 1, -0.5, true); // horizontal axis
    G2D.strokeCircle("#555", 2, sx, sy, ex, Math.PI, 0, true);
    G2D.fillCircle("#999", sx, sy, ex, Math.PI, -rad + 1e-6, true);
    G2D.line("#fff", 2, sx, sy, rx, ry, true);

    G2D.setFontFamily("Arial").setFontSize(G2D.toResponsive(0.5)).setTextAlignment("center");
    G2D.fillText(0, -1 + 0.01, this.throttle.toFixed(3) + "%", "#fff", true);

    this.controller.throttleDiagram.set(G2D.canvas, "image/jpeg", 1.0);
  }

  onRemove(parent) {
    this.toRemove = false;

    if (parent.is(Type.PLAYER)) {
      parent.thrusters.delete(this.id);
      parent.controlledThrusters.delete(this.id);
      parent.idManager.release(this.id);
      this.id = null;
      this.controller && this.controller.remove();
    }

    return this;
  }

  // prettier-ignore
  onInsert(parent) {
    this.dirty = true; // Lehet, hogy új localPosition-t kapott szóval a nyomatékot újra kell számolni!

    if (parent.is(Type.PLAYER)) {
      this.id = parent.idManager.get();
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
      parent.thrusters.set(this.id, this);
      this.updateGimbalDiagram();
      this.updateThrottleDiagram();
    }

    return this;
  }

  reset() {
    vec2.copy(this.exhaustDirection, this.defaultExhaustDirection);
    this._gimbal = 0;
    this.throttle = 1;

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

    this.updateGimbalDiagram();

    this.dirty = true;

    return this;
  }

  reset() {
    this._gimbal = 0;

    if (this._gimbal === this.previousGimbal) return;

    vec2.copy(this.exhaustDirection, this.defaultExhaustDirection);

    vec2.rotate(this.exhaustDirection, this._gimbal * (Math.PI / 180));
    this.previousGimbal = this._gimbal;

    this.updateGimbalDiagram();

    // prettier-ignore
    // {
    //   this.controller.exhaustDirection.textContent = `[${this.exhaustDirection[0].toFixed(4)}, ${this.exhaustDirection[1].toFixed(4)}]`;
    //   this.controller._gimbal.textContent = this._gimbal.toFixed(4);
    // }

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
    // this.controller.throttle.textContent = this.throttle.toFixed(4);
    this.updateThrottleDiagram();
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
