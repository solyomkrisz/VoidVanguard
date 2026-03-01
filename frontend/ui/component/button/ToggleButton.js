import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class ToggleButton extends BaseCustomElement {
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
    super([path.join(dir, "global.css")]);
  }

  connectedCallback() {
    if (this._initialized) return;

    this.build();

    this._initialized = true;
  }

  build() {
    this.appendShadowChild(element("button", element("slot"))).addEventListener(
      "click",
      () => {
        const target = document.querySelector(this.target);
        if (!target) return;
        target.hidden = !target.hidden;
      },
    );
  }
}

window.customElements.define("toggle-button", ToggleButton);
