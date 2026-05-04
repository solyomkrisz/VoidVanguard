import { el } from "/ui/UI.js";

export default class ResumeButton extends HTMLElement {
  constructor() {
    super();

    this._built = false;
    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    this.dispatchEvent(
      new CustomEvent("resume-game", { bubbles: true, composed: true }),
    );
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    const button = el(
      "button",
      { "data-sfx": "click_1", onClick: this.onClick },
      ["Folytatás"],
    );
    this.appendChild(button);

    this._built = true;
  }
}

window.customElements.define("resume-button", ResumeButton);
