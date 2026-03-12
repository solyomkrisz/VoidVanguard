import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import _ from "/ui/component/button/ToggleButton.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class FullscreenOverlay extends BaseCustomElement {
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
    super([
      path.join(dir, "global.css"),
      path.join(dir, "fullscreenOverlay.css"),
    ]);
  }

  connectedCallback() {
    if (this._initialized) return;

    this.setShadowInnerHTML(`
      <toggle-button target="${this.target}">
        <button>Bezár</button>
      </toggle-button>
      <slot></slot>
    `);

    this._initialized = true;
  }
}

window.customElements.define("fullscreen-overlay", FullscreenOverlay);
