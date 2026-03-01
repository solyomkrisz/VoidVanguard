import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import _ from "./InputGroup.js";
import _2 from "/ui/component/feedback/ResponseMessage.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";
import * as net from "/common/network.js";

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

    this.setShadowInnerHTML(`
      <slot></slot>
      <response-message hidden></response-message>  
    `);

    const responseMessage = this.queryShadowSelector("response-message");

    this.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!this.method) return;

      const formData = new FormData(e.currentTarget);

      const response = await net.send(this.url, {
        method: this.method,
        body: formData,
      });

      responseMessage.from(response);

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
