import BaseCustomElement from "/ui/component/BaseCustomElement.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class ProfileFormToggle extends BaseCustomElement {
  constructor() {
    super([path.join(dir, "global.css")]);
    this.elements = {};
  }

  connectedCallback() {
    if (this._initialized) return;
    this.build();
    this._initialized = true;
  }

  build() {
    this.elements.button = this.add(
      element("button", text("Profil szerkesztése")),
    );
  }
}

window.customElements.define("profile-form-toggle", ProfileFormToggle);
