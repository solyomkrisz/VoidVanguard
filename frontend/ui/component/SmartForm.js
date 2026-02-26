import BaseCustomElement from "/ui/component/BaseCustomElement.js";
import _ from "/ui/component/InputGroup.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";
import * as net from "/common/network.js";
import State from "/state/State.js";

export default class SmartForm extends BaseCustomElement {
  static get observedAttributes() {
    return ["url", "method"];
  }

  get url() {
    return this.getAttribute("url");
  }

  set url(value) {
    this.setAttribute("url", value);
  }

  get method() {
    return this.getAttribute("method");
  }

  set method(value) {
    this.setAttribute("method", value);
  }

  constructor() {
    super([path.join(dir, "global.css")]);
  }

  connectedCallback() {
    if (this._initialized) return;
    this.build();
    this._initialized = true;
    console.log(this.url, this.method);
  }

  build() {
    this.add(element("slot"));
  }
}

window.customElements.define("smart-form", SmartForm);
