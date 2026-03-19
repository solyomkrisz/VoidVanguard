import _ from "./InputGroup.js";
import _1 from "/ui/component/feedback/ResponseMessage.js";
import { element } from "/ui/UI.js";
import * as net from "/common/network.js";
import { defineAttributeAccessors } from "../core/Core.js";

function getTarget(element, value) {
  if (!value) return [];

  const splitted = value.split(":");

  if (splitted.length === 1) {
    return Array.from(document.querySelectorAll(splitted[0]));
  }

  switch (splitted[0]) {
    case "closest":
      const target = element.closest(splitted[1]);
      return target ? [target] : [];
    default:
      return [];
  }
}

function isBodyAllowed(method) {
  return !["GET", "HEAD"].includes(method.toUpperCase());
}

// prettier-ignore
const attributes = {
  "url": { type: String },
  "method": { type: String },
  "refresh-target": { type: String },
  "response-target": { type: String },
  "show-response-message": { type: Boolean },
};

class SmartForm extends HTMLElement {
  constructor() {
    super();
  }

  setConfig(config = {}) {}

  getConfig() {
    return {
      url: this.url,
      method: this.method,
      refreshTarget: this.refreshTarget,
      responseTarget: this.responseTarget,
      showResponseMessage: this.showResponseMessage,
    };
  }

  connectedCallback() {
    if (this._initialized) return;

    const form = this.querySelector("form");

    if (!form) {
      console.warn("<smart-form> must have a <form> child!");
      return;
    }

    const responseMessage = form.appendChild(
      element("response-message").attr("hidden", ""),
    );

    // const config = this.getConfig();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const targetForm = e.currentTarget;

      const requestConfig = {
        method: this.method || "GET",
      };

      if (isBodyAllowed(this.method)) {
        requestConfig.body = new FormData(targetForm);
      }

      const response = await net.send(this.url, requestConfig);

      this.dispatchEvent(
        new CustomEvent("response", {
          detail: { response },
          bubbles: true,
          composed: true,
        }),
      );

      if (this.showResponseMessage) {
        responseMessage.from(response);
      }

      if (this.responseTarget) {
        try {
          document.querySelector(this.responseTarget).onResponse(response);
        } catch (error) {
          console.error(
            "Unable to send response to the specified target(s): " +
              this.responseTarget +
              ".",
          );
        }
      }

      if (response.success) {
        form.reset();

        try {
          for (const element of getTarget(form, this.refreshTarget)) {
            element.refresh?.();
          }
        } catch (error) {
          console.error(error);
          console.error("Unable to refresh target.");
        }
      }
    });

    this._initialized = true;

    // this.unwrap();
    // this.replaceWith(form);
  }

  unwrap() {
    if (!this.parentNode) return;

    while (this.firstChild) {
      this.parentNode.insertBefore(this.firstChild, this);
    }

    this.parentNode.removeChild(this);
  }
}

defineAttributeAccessors(SmartForm.prototype, attributes);

window.customElements.define("smart-form", SmartForm);

export default SmartForm;
