import BaseCustomElement from "/ui/component/BaseCustomElement.js";
import _ from "/ui/component/InputGroup.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";
import * as net from "/common/network.js";
import State from "/state/State.js";

export default class ErrorMessage extends BaseCustomElement {
  constructor() {
    super([path.join(dir, "global.css"), path.join(dir, "errorMessage.css")]);
    this.elements = {};
  }

  connectedCallback() {
    if (this._initialized) return;
    this.build();
    this._initialized = true;
  }

  build() {
    this.elements.message = this.add(element("p", text("Error Message!")));
  }

  set(error) {
    const { message, code } = error;

    this.elements.message.textContent = message;
  }
}

window.customElements.define("error-message", ErrorMessage);
