import BaseCustomElement from "/ui/component/BaseCustomElement.js";
import _ from "/ui/component/InputGroup.js";
import _2 from "/ui/component/ErrorMessage.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";
import * as net from "/common/network.js";
import State from "/state/State.js";

export default class SmartFormWrapper extends BaseCustomElement {
  static get observedAttributes() {
    return ["url", "method", "target"];
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

    this.add(element("slot"));
    const error = this.add(element("error-message"));

    this.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(e.currentTarget);

      const response = await net.send(this.url, {
        method: this.method,
        body: formData,
      });

      response && !response.success && error.set(response.result);

      try {
        document.querySelector(this.target).onResponse(response);
      } catch (error) {
        console.error("Unable to send response to target.");
      }
    });

    this._initialized = true;
  }
}

window.customElements.define("smart-form-wrapper", SmartFormWrapper);
