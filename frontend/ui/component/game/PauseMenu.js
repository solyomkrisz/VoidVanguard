import BaseCustomElement from "../core/BaseCustomElement.js";

export default class PauseMenu extends BaseCustomElement {
  set game(value) {
    this._game = value;
  }

  get game() {
    return this._game;
  }

  constructor() {
    super(["../style/pauseMenu.css"]);

    this._elements = {};
    this._game = null;
    this._built = false;

    this.onResume = this.onResume.bind(this);
  }

  onResume() {
    if (!this.game) return;
    this.game.resume();
  }

  connectedCallback() {}

  build() {
    if (this._built) return;

    this.setShadowInnerHTML(`
        <button>Folytatás</button>    
    `);

    const resumeButton = this.queryShadowSelector("button");
    resumeButton.addEventListener("click", this.onResume);
    this._elements.resumeButton = resumeButton;

    this._built = true;
  }

  show() {
    this.hidden = false;
  }

  hide() {
    this.hidden = true;
  }
}

window.customElements.define("pause-menu", PauseMenu);
