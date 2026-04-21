import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import Game from "/game/Game.js";
import { dir, el } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class GameControllerContainer extends BaseCustomElement {
  setGame(value) {
    if (!(value instanceof Game)) {
      throw new Error(
        "GAMECONTROLLERCONTAINER-setGame: game must be an instance of Game!",
      );
    }
    this._game = value;
  }

  get game() {
    return this._game;
  }

  constructor() {
    super([path.join(dir, "gameControllerContainer.css")]);

    this._game = null;
    this._built = false;

    this.onPauseGame = this.onPauseGame.bind(this);
  }

  onPauseGame(e) {
    e.stopPropagation();
    if (!this._game) return;
    this._game.stop();
  }

  connectedCallback() {
    this.build();
    this.enableListeners();
  }

  disconnectedCallback() {
    this.disableListeners();
  }

  enableListeners() {
    this.addEventListener("pause-game", this.onPauseGame);
  }

  disableListeners() {
    this.removeEventListener("pause-game", this.onPauseGame);
  }

  build() {
    if (this._built) return;

    this._built = true;
  }
}

window.customElements.define(
  "game-controller-container",
  GameControllerContainer,
);
