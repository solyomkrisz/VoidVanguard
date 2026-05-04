import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import _ from "/ui/component/form/InputGroup.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";

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
    this.elements.message = this.appendShadowChild(element("p"));
  }

  setMessage(message) {
    this.elements.message.textContent = message;
  }

  from(response) {
    this.hidden = false;

    if (!response || (response && !response.success)) {
      this.setAttribute("class", "error");
    } else {
      this.setAttribute("class", "");
    }

    this.setMessage(response.message);
  }
}

window.customElements.define("response-message", ResponseMessage);
