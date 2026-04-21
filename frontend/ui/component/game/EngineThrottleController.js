import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import Game from "/game/Game.js";
import { dir, el } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class EngineThrottleController extends BaseCustomElement {
  static THROTTLE_UP = "EngineThrottleUp";
  static THROTTLE_DOWN = "EngineThrottleDown";

  setGame(value) {
    if (!(value instanceof Game)) {
      throw new Error(
        "ENGINETHROTTLECONTROLLER-setGame: game must be an instance of Game!",
      );
    }
    this._game = value;
  }

  get game() {
    return this._game;
  }

  constructor() {
    super([path.join(dir, "engineThrottleController.css")]);

    this._game = null;
    this.observed = new Set();

    this._built = false;

    this.throttlethrottleUpBtn = null;
    this.throttlethrottleDownBtn = null;

    this.throttleUpBtnPointerId = null;
    this.throttleDownBtnPointerId = null;

    this.onThrottleUpBtnPointerDown =
      this.onThrottleUpBtnPointerDown.bind(this);
    this.onThrottleUpBtnPointerUp = this.onThrottleUpBtnPointerUp.bind(this);
    this.onThrottleDownBtnPointerDown =
      this.onThrottleDownBtnPointerDown.bind(this);
    this.onThrottleDownBtnPointerUp =
      this.onThrottleDownBtnPointerUp.bind(this);
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

    this.throttleUpBtn = el("button", {}, ["THRUST +"]);
    this.throttleDownBtn = el("button", {}, ["THRUST -"]);

    this.throttleUpBtn.style.width = "100%";
    this.throttleDownBtn.style.width = "100%";

    this.appendShadowChild(this.throttleUpBtn);
    this.appendShadowChild(this.throttleDownBtn);
  }

  observeControl(control) {
    this.observed.add(control);
  }

  // prettier-ignore
  enableListening() {
    this.throttleUpBtn.addEventListener("pointerdown", this.onThrottleUpBtnPointerDown);
    this.throttleUpBtn.addEventListener("pointerup", this.onThrottleUpBtnPointerUp);
    this.throttleUpBtn.addEventListener("pointercancel", this.onThrottleUpBtnPointerUp);

    this.throttleDownBtn.addEventListener("pointerdown", this.onThrottleDownBtnPointerDown);
    this.throttleDownBtn.addEventListener("pointerup", this.onThrottleDownBtnPointerUp);
    this.throttleDownBtn.addEventListener("pointercancel", this.onThrottleDownBtnPointerUp);
  }

  // prettier-ignore
  disableListening() {
    this.throttleUpBtn.removeEventListener("pointerdown", this.onThrottleUpBtnPointerDown);
    this.throttleUpBtn.removeEventListener("pointerup", this.onThrottleUpBtnPointerUp);
    this.throttleUpBtn.removeEventListener("pointercancel", this.onThrottleUpBtnPointerUp);

    this.throttleDownBtn.removeEventListener("pointerdown", this.onThrottleDownBtnPointerDown);
    this.throttleDownBtn.removeEventListener("pointerup", this.onThrottleDownBtnPointerUp);
    this.throttleDownBtn.removeEventListener("pointercancel", this.onThrottleDownBtnPointerUp);
  }

  // throttle up button handlers
  onThrottleUpBtnPointerDown(event) {
    const key = EngineThrottleController.THROTTLE_UP;

    if (!this.observed.has(key)) return;
    if (this.throttleUpBtnPointerId !== null) return;

    this.throttleUpBtnPointerId = event.pointerId;
    this.game.activeControls.add(key);

    event.target.setPointerCapture?.(event.pointerId);
  }

  onThrottleUpBtnPointerUp(event) {
    const key = EngineThrottleController.THROTTLE_UP;

    if (event.pointerId !== this.throttleUpBtnPointerId) return;

    this.throttleUpBtnPointerId = null;
    this.game.activeControls.delete(key);

    event.target.releasePointerCapture?.(event.pointerId);
  }

  // throttle down button handlers
  onThrottleDownBtnPointerDown(event) {
    const key = EngineThrottleController.THROTTLE_DOWN;

    if (!this.observed.has(key)) return;
    if (this.throttleDownBtnPointerId !== null) return;

    this.throttleDownBtnPointerId = event.pointerId;
    this.game.activeControls.add(key);

    event.target.setPointerCapture?.(event.pointerId);
  }

  onThrottleDownBtnPointerUp(event) {
    const key = EngineThrottleController.THROTTLE_DOWN;
    if (event.pointerId !== this.throttleDownBtnPointerId) return;

    this.throttleDownBtnPointerId = null;
    this.game.activeControls.delete(key);

    event.target.releasePointerCapture?.(event.pointerId);
  }
}

window.customElements.define(
  "engine-throttle-controller",
  EngineThrottleController,
);
