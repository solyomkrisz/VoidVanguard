import { element, text } from "/ui/UI.js";

export default class DomToggle extends HTMLElement {
  static get observedAttributes() {
    return ["target-selector"];
  }

  get targetSelector() {
    return this.getAttribute("target-selector");
  }

  set targetSelector(value) {
    this.setAttribute("target-selector", value);
  }

  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
  }

  connectedCallback() {
    if (this._initialized) return;

    this.build();

    this._initialized = true;
  }

  onClick() {
    if (!this.targetSelector?.trim()) return;

    const targets = Array.from(document.querySelectorAll(this.targetSelector));

    if (!targets.length) return;

    for (const target of targets) {
      if (!(target instanceof HTMLElement)) continue;
      target.hidden = !target.hidden;
    }
  }

  build() {
    let button = this.querySelector("button");

    if (!button) {
      button = element("button", text("toggle-button"));
      this.appendChild(button);
    }

    button.addEventListener("click", this.onClick);
  }
}

window.customElements.define("dom-toggle", DomToggle);
