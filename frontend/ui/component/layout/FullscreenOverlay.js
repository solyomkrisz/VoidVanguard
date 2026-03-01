import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import _ from "/ui/component/button/ToggleButton.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class FullscreenOverlay extends BaseCustomElement {
  constructor() {
    super([
      path.join(dir, "global.css"),
      path.join(dir, "fullscreenOverlay.css"),
    ]);
  }

  connectedCallback() {
    if (this._initialized) return;

    this.setShadowInnerHTML(`
      <toggle-button target="fullscreen-overlay">
        <span>Bezár</span>
      </toggle-button>
      <slot></slot>
    `);

    this._initialized = true;
  }
}

window.customElements.define("fullscreen-overlay", FullscreenOverlay);
