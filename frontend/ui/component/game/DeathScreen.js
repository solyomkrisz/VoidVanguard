import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";

export default class DeathScreen extends BaseCustomElement {
  set game(value) {
    this._game = value;
  }

  get game() {
    return this._game;
  }

  constructor() {
    super([
      path.join(dir, "global.css"),
      path.join(dir, "deathScreen.css"),
    ]);

    this._game = null;
    this._built = false;

    this.onExit = this.onExit.bind(this);
  }

  onExit(e) {
    e.stopPropagation();

    if (!this.game) return;
    this.game.destroy();

    document.dispatchEvent(
      new CustomEvent("exit-game", { detail: { game: this._game } }),
    );
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    this.hidden = true;

    this.setShadowInnerHTML(`
      <h1 class="title">Játék Vége</h1>
      <p class="subtitle">Az űrhajód megpusztult.</p>
      <p class="score"></p>
      <div class="actions">
        <button class="exit-btn" data-sfx="click_1">Kilépés</button>
      </div>
    `);

    this.shadowRoot.querySelector(".exit-btn").addEventListener("click", this.onExit);

    this._built = true;
  }

  show() {
    const scoreEl = this.shadowRoot?.querySelector(".score");
    if (scoreEl && this._game?.player?.score != null) {
      scoreEl.textContent = `Végső pontszám: ${this._game.player.score}`;
    }
    this.hidden = false;
  }

  hide() {
    this.hidden = true;
  }

  destroy() {
    this.remove();
  }
}

window.customElements.define("death-screen", DeathScreen);
