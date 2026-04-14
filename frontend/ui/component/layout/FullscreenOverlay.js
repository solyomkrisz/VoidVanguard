import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class FullscreenOverlay extends BaseCustomElement {
  static get observedAttributes() {
    return ["no-close"];
  }

  set noClose(value) {
    if (value) {
      this.setAttribute("no-close", "");
    } else {
      this.removeAttribute("no-close");
    }
  }

  get noClose() {
    return this.hasAttribute("no-close");
  }

  constructor() {
    super([
      path.join(dir, "global.css"),
      path.join(dir, "fullscreenOverlay.css"),
    ]);

    this._elements = {};
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "no-close") {
      this.updateCloseButtonVisibility();
    }
  }

  updateCloseButtonVisibility() {
    const closeButton = this._elements?.closeButton;
    if (!closeButton) return;
    closeButton.hidden = this.noClose;
  }

  connectedCallback() {
    if (this._initialized) return;

    this.setShadowInnerHTML(`
      <button id="close-button">Bezár</button>
      <slot></slot>
    `);

    const closeButton = this.queryShadowSelector("#close-button");
    closeButton.addEventListener("click", () => {
      this.hidden = true;
    });
    this._elements.closeButton = closeButton;
    this.updateCloseButtonVisibility();

    this._initialized = true;
  }
}

window.customElements.define("fullscreen-overlay", FullscreenOverlay);
