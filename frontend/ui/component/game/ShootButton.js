import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import Game from "/game/Game.js";
import { dir, el } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class ShootButton extends BaseCustomElement {
  static SHOOT = "Shoot";

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
    super([path.join(dir, "shootButton.css")]);

    this._game = null;
    this.observed = new Set();

    this.pointerId = null;
    this._built = false;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerCancel = this.onPointerCancel.bind(this);
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

    this.appendShadowChild(el("button", {}, ["Lövés!"]));

    this.style.touchAction = "none";
  }

  observeControl(control) {
    if (typeof control !== "string") {
      throw new Error("SHOOTBUTTON-observeControl: control must be a string!");
    }

    this.observed.add(control);
  }

  enableListening() {
    this.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerCancel);
  }

  disableListening() {
    this.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerCancel);
  }

  destroy() {
    this.disableListening();
    this.remove();
  }

  onPointerDown(event) {
    const control = ShootButton.SHOOT;

    if (!this.observed.has(control)) return;
    if (this.pointerId !== null) return;

    this.pointerId = event.pointerId;
    this.game.activeControls.add(control);

    this.setPointerCapture?.(event.pointerId);
  }

  onPointerUp(event) {
    const control = ShootButton.SHOOT;

    if (event.pointerId !== this.pointerId) return;

    this.pointerId = null;
    this.game.activeControls.delete(control);

    this.releasePointerCapture?.(event.pointerId);
  }

  onPointerCancel(event) {
    const control = ShootButton.SHOOT;

    if (event.pointerId !== this.pointerId) return;

    this.pointerId = null;
    this.game.activeControls.delete(control);
  }
}

window.customElements.define("shoot-button", ShootButton);
