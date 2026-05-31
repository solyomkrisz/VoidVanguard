/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/game/ZoomController.js
 * Szerep: Jateknezet-valto gomb cooldownnal es Game-peldany ellenorzessel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import GameControllerElement from "/ui/component/game/GameControllerElement.js";
import Game from "/game/Game.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class ZoomController extends GameControllerElement {
  setGame(value) {
    // Korán hibazunk, ha rossz tipusu objektumot kap a komponens forraskent.
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
    super([path.join(dir, "zoomController.css")]);

    this._elements = {};
    this._built = false;
    this._lastClickTime = 0;
    this._cooldownMs = 500;

    this.onPointerUp = this.onPointerUp.bind(this);
  }

  onPointerUp(e) {
    const now = window.performance.now();

    // A kis cooldown megakadalyozza a veletlen dupla erintesbol jovo gyors nezetcseret.
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

    this.style.touchAction = "none";

    this.setShadowInnerHTML(`
      <button>Nézetváltás</button>
    `);

    this._elements.button = this.queryShadowSelector("button");
    this._elements.button.addEventListener("pointerup", this.onPointerUp);

    this._built = true;
  }
}

window.customElements.define("zoom-controller", ZoomController);
