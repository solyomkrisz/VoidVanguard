import GameControllerElement from "/ui/component/game/GameControllerElement.js";
import Game from "/game/Game.js";

export default class ZoomController extends GameControllerElement {
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
    super();

    this._elements = {};
    this._built = false;
    this._lastClickTime = 0;
    this._cooldownMs = 500;

    this.onPointerUp = this.onPointerUp.bind(this);
  }

  onPointerUp(e) {
    const now = window.performance.now();

    if (now - this._lastClickTime < this._cooldownMs) {
      return;
    }

    this._lastClickTime = now;

    this.game.toggleBuilderView();
  }

  connectedCallback() {
    super.connectedCallback?.();
    this.build();
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
  }

  build() {
    if (this._built) return;

    this.setShadowInnerHTML(`
      <button>Nézetváltás</button>
    `);

    this._elements.button = this.queryShadowSelector("button");
    this._elements.button.addEventListener("pointerup", this.onPointerUp);

    this._built = true;
  }
}

window.customElements.define("zoom-controller", ZoomController);
