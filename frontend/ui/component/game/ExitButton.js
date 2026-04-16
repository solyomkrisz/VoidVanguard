import { el } from "/ui/UI.js";

export default class ExitButton extends HTMLElement {
  constructor() {
    super();

    this._built = false;
    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    this.dispatchEvent(
      new CustomEvent("exit-game", { bubbles: true, composed: true }),
    );
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    const button = el("button", { onClick: this.onClick }, ["Kilépés"]);
    this.appendChild(button);

    this._built = true;
  }
}

window.customElements.define("exit-button", ExitButton);
