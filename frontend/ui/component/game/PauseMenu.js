import BaseCustomElement from "../core/BaseCustomElement.js";

export default class PauseMenu extends BaseCustomElement {
  set game(value) {
    this._game = value;
  }

  get game() {
    return this._game;
  }

  constructor() {
    super([
      "/frontend/ui/style/global.css",
      "/frontend/ui/style/pauseMenu.css",
    ]);

    this._elements = {};
    this._game = null;
    this._built = false;

    this.onResume = this.onResume.bind(this);
    this.onSaveRequest = this.onSaveRequest.bind(this);
  }

  onResume() {
    if (!this.game) return;
    this.game.resume();
  }

  async onSaveRequest(e) {
    const formData = e?.detail?.formData;
    if (!formData) {
      console.error("Unable to process save request");
      return;
    }

    await this.game.saveCurrentStateAs(formData);

    e.target.enable?.();
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    this.hidden = true;

    this.setShadowInnerHTML(`
        <button>Folytatás</button>    
    `);

    const resumeButton = this.queryShadowSelector("button");
    resumeButton.addEventListener("click", this.onResume);
    this._elements.resumeButton = resumeButton;

    this.addEventListener("save-request", this.onSaveRequest);

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
