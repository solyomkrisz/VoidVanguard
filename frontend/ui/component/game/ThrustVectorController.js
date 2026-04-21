import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import Game from "/game/Game.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class ThrustVectorController extends BaseCustomElement {
  static GIMBAL_LEFT = "GimbalLeft";
  static GIMBAL_RIGHT = "GimbalRight";
  static GIMBAL_RESET = "GimbalReset";

  setGame(value) {
    if (!(value instanceof Game)) {
      throw new Error("must be Game");
    }
    this._game = value;
  }

  get game() {
    return this._game;
  }

  constructor() {
    super([path.join(dir, "thrustVectorController.css")]);

    this._game = null;
    this._built = false;

    this.pointerId = null;
    this.hasPointerCapture = false;
    this.resetPointerId = null;

    this.x = 0;

    this.threshold = 0.25;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onResetButtonPointerDown = this.onResetButtonPointerDown.bind(this);
    this.onResetButtonPointerUp = this.onResetButtonPointerUp.bind(this);
  }

  onResetButtonPointerDown(e) {
    e.stopPropagation();

    if (this.resetPointerId !== null) return;

    this.resetPointerId = e.pointerId;

    this.game.activeControls.add(ThrustVectorController.GIMBAL_RESET);

    this.x = 0;
    this.updateKnob(0);
  }

  onResetButtonPointerUp(e) {
    e.stopPropagation();

    if (e.pointerId !== this.resetPointerId) return;

    this.resetPointerId = null;

    this.game.activeControls.delete(ThrustVectorController.GIMBAL_RESET);
  }

  connectedCallback() {
    this.build();
    this.enableListening();
  }

  disconnectedCallback() {
    this.disableListening();
  }

  build() {
    if (this._built) return;
    this._built = true;

    this.style.touchAction = "none";

    this.setShadowInnerHTML(`
      <div class="base">
        <button class="button open-engine-controls"></button>
        <div class="knob"></div>
        <button class="button reset">↺</button>
      </div>
    `);

    this.base = this.queryShadowSelector(".base");
    this.knob = this.queryShadowSelector(".knob");
    this.openEngineControlsButton = this.queryShadowSelector(
      ".open-engine-controls",
    );
    this.resetButton = this.queryShadowSelector(".reset");
  }

  enableListening() {
    this.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);

    this.resetButton.addEventListener(
      "pointerdown",
      this.onResetButtonPointerDown,
    );
    window.addEventListener("pointerup", this.onResetButtonPointerUp);
    window.addEventListener("pointercancel", this.onResetButtonPointerUp);
  }

  disableListening() {
    this.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);

    this.resetButton.removeEventListener(
      "pointerdown",
      this.onResetButtonPointerDown,
    );
    window.removeEventListener("pointerup", this.onResetButtonPointerUp);
    window.removeEventListener("pointercancel", this.onResetButtonPointerUp);
  }

  onPointerDown(e) {
    if (this.pointerId !== null) return;

    this.pointerId = e.pointerId;

    this.setPointerCapture?.(e.pointerId);
    this.hasPointerCapture = true;

    this.update(e);
  }

  onPointerMove(e) {
    if (e.pointerId !== this.pointerId) return;
    this.update(e);
  }

  onPointerUp(e) {
    if (e.pointerId !== this.pointerId) return;

    this.pointerId = null;
    this.x = 0;

    this.clearGimbal();
    this.updateKnob(0);

    if (this.hasPointerCapture) {
      this.releasePointerCapture?.(e.pointerId);
      this.hasPointerCapture = false;
    }
  }

  update(e) {
    const rect = this.base.getBoundingClientRect();

    const cx = rect.left + rect.width / 2;

    let x = (e.clientX - cx) / (rect.width / 2);

    if (Math.abs(x) > 1) x = Math.sign(x);

    this.x = x;

    this.applyGimbal();
    this.updateKnob(x);
  }

  applyGimbal() {
    const activeControls = this.game.activeControls;

    activeControls.delete(ThrustVectorController.GIMBAL_LEFT);
    activeControls.delete(ThrustVectorController.GIMBAL_RIGHT);

    if (this.x < -this.threshold)
      activeControls.add(ThrustVectorController.GIMBAL_LEFT);
    else if (this.x > this.threshold)
      activeControls.add(ThrustVectorController.GIMBAL_RIGHT);
  }

  clearGimbal() {
    const activeControls = this.game.activeControls;

    activeControls.delete(ThrustVectorController.GIMBAL_LEFT);
    activeControls.delete(ThrustVectorController.GIMBAL_RIGHT);
  }

  updateKnob(x) {
    // translation radius from css variable
    const rStr = getComputedStyle(this)
      .getPropertyValue("--knob-translation-radius")
      .trim();
    const r = parseFloat(rStr);

    this.knob.style.transform = `translate(${x * r}px, 0px)`;
  }
}

window.customElements.define(
  "thrust-vector-controller",
  ThrustVectorController,
);
