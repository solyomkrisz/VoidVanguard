import _ from "./InputGroup.js";
import _2 from "/ui/component/feedback/ResponseMessage.js";
import { element } from "/ui/UI.js";
import * as net from "/common/network.js";

function getTarget(element, value) {
  if (!value) return null;

  const splitted = value.split(":");

  if (splitted.length === 1) {
    return Array.from(document.querySelectorAll(splitted[0]));
  }

  switch (splitted[0]) {
    case "closest":
      return [element.closest(splitted[1])];
  }
}

function isBodyAllowed(method) {
  return !["GET", "HEAD"].includes(method.toUpperCase());
}

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

      const form = e.currentTarget;

      const config = {
        method: this.method || "GET",
      };

      if (isBodyAllowed(this.method)) {
        config.body = new FormData(form);
      }

      const response = await net.send(this.url, config);

      this.dispatchEvent(
        new CustomEvent("response", {
          detail: { response },
        }),
      );

      if (this.showResponseMessage) {
        responseMessage.from(response);
      }

      try {
        document.querySelector(this.responseTarget).onResponse(response);
      } catch (error) {
        console.error("Unable to send response to target.");
      }

      if (response.success) {
        form.reset();

        try {
          for (const element of getTarget(this, this.refreshTarget)) {
            element.refresh?.();
          }
        } catch (error) {
          console.error(error);
          console.error("Unable to refresh target.");
        }
      }
    });

    this._initialized = true;
  }
}

window.customElements.define("smart-form-wrapper", SmartFormWrapper);
