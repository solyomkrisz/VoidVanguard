import BaseCustomElement from "/ui/component/BaseCustomElement.js";
import _ from "/ui/component/InputGroup.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";
import * as net from "/common/network.js";
import State from "/state/State.js";

export default class ResponseMessage extends BaseCustomElement {
  constructor() {
    super([
      path.join(dir, "global.css"),
      path.join(dir, "responseMessage.css"),
    ]);
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

  setMessage(message) {
    this.elements.message.textContent = message;
  }

  from(response) {
    this.hidden = false;

    if (!response || (response && !response.success)) {
      this.setAttribute("class", "error");
      this.setMessage(response.result.message);
    } else {
      this.setMessage(response.message);
    }
  }
}

window.customElements.define("response-message", ResponseMessage);
