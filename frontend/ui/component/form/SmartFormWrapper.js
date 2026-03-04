import _ from "./InputGroup.js";
import _2 from "/ui/component/feedback/ResponseMessage.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";
import * as net from "/common/network.js";

export default class SmartFormWrapper extends HTMLElement {
  static get observedAttributes() {
    return [
      "url",
      "method",
      "refresh-target",
      "response-target",
      "show-response-message",
    ];
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

  get refreshTarget() {
    return this.getAttribute("refresh-target");
  }

  set refreshTarget(value) {
    this.setAttribute("refresh-target", value);
  }

  get responseTarget() {
    return this.getAttribute("response-target");
  }

  set responseTarget(value) {
    this.setAttribute("response-target", value);
  }

  get showResponseMessage() {
    return this.hasAttribute("show-response-message");
  }

  set showResponseMessage(value) {
    this.setAttribute("show-response-message", value);
  }

  constructor() {
    super();
  }

  connectedCallback() {
    if (this._initialized) return;

    const responseMessage = this.appendChild(
      element("response-message").attr("hidden", ""),
    );

    this.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!this.method) return;

      const formData = new FormData(e.currentTarget);

      const response = await net.send(this.url, {
        method: this.method || "GET",
        body: formData,
      });

      if (this.showResponseMessage) {
        responseMessage.from(response);
      }

      try {
        document.querySelector(this.responseTarget).onResponse(response);
      } catch (error) {
        console.error("Unable to send response to target.");
      }

      try {
        document.querySelector(this.refreshTarget).refresh();
      } catch (error) {
        console.error("Unable to refresh target.");
      }
    });

    this._initialized = true;
  }
}

window.customElements.define("smart-form-wrapper", SmartFormWrapper);
