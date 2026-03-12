import { element, text } from "/ui/UI.js";

export default class ToggleButton extends HTMLElement {
  static get observedAttributes() {
    return ["target"];
  }

  get target() {
    return this.getAttribute("target");
  }

  set target(value) {
    this.setAttribute("target", value);
  }

  constructor() {
    super();
  }

  connectedCallback() {
    if (this._initialized) return;

    this.build();

    this._initialized = true;
  }

  build() {
    let button = this.querySelector("button");

    if (!button) {
      button = element("button", text("toggle-button"));
      this.appendChild(button);
    }

    button.addEventListener("click", () => {
      const targets = Array.from(document.querySelectorAll(this.target));

      if (!targets.length) return;

      for (const target of targets) {
        target.hidden = !target.hidden;
      }
    });
  }
}

window.customElements.define("toggle-button", ToggleButton);
