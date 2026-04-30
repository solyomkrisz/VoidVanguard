import { setFieldValue } from "/common/common.js";
import * as net from "/common/network.js";

export default class FormRestorer extends HTMLElement {
  static get observedAttributes() {
    return ["src", "user-id"];
  }

  get src() {
    return this.getAttribute("src");
  }

  constructor() {
    super();

    this._data = null;
    this._target = null;
    this._loadToken = null;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if ((name === "src" || name === "user-id") && oldValue !== newValue) {
      if (newValue) {
        this.load();
      } else {
        this.reset();
      }
    }
  }

  connectedCallback() {
    this._target =
      this.querySelector("[restore]") || this.querySelector("form");

    if (!this._target) {
      console.warn(
        "<form-restorer> requires a child with the 'restore' attribute or a form element.",
      );
      return;
    }

    if (this.hasAttribute("src")) {
      this.load();
    }
  }

  async load() {
    const url = this.getEndpoint();
    if (!url) return;
    if (!this._target) return;

    const token = Symbol();
    this._loadToken = token;

    console.log("URL: ", url, this);
    const response = await net.send(url);

    if (this._loadToken !== token) {
      return;
    }

    const { success, result, message } = response;

    if (!success || !result) {
      console.error(message);
      return;
    }

    this._data = result;

    const mapped = this.mapDataToFields(result);
    this.restore(mapped);

    this.dispatchEvent(
      new CustomEvent("form-restored", {
        detail: { data: this._data },
        bubbles: true,
        composed: true,
      }),
    );
  }

  get(obj, path) {
    return path.split(".").reduce((obj, key) => obj?.[key], obj);
  }

  mapDataToFields(data) {
    const mapping = this.constructor.mapping;

    if (!mapping) {
      return Object.fromEntries(
        Object.entries(data).filter(([key]) =>
          this._target.elements.namedItem(key),
        ),
      );
    }

    const result = {};

    for (const [field, path] of Object.entries(mapping)) {
      result[field] = this.get(data, path);
    }

    return result;
  }

  reset() {
    if (this._target instanceof HTMLFormElement) {
      this._target.reset();
      return;
    }

    this.resetCustomElement();
  }

  restore(mapped) {
    if (this._target instanceof HTMLFormElement) {
      this.restoreForm(mapped);
      return;
    }

    this.restoreCustomElement(mapped);
  }

  restoreForm(mapped) {
    for (const [name, value] of Object.entries(mapped)) {
      const field = this._target.elements.namedItem(name);
      if (!field) continue;
      setFieldValue(field, value);
    }
  }

  async restoreCustomElement(mapped) {
    await window.customElements.whenDefined(this._target.tagName.toLowerCase());

    /**
     * This class is usually extended and may target another custom element.
     * If the target of the dispatched restore event is a custom element,
     * the restoration is deferred to that element.
     * In that case you must import the target's class in the same module as the subclass
     * to ensure the event dispatch works correctly, and more importantly, so that the target custom element instances
     * are upgraded and have the required handlers.
     *
     * In JS modules, top-level imports block execution until resolved.
     * Custom elements are upgraded synchronously when defined, so the target
     * must already be defined by the time this logic runs.
     * Using CustomElementRegistry.prototype.whenDefined here may not be necessary if the target
     * is imported at the top.
     */
    this._target.dispatchEvent(
      new CustomEvent("restore", {
        detail: { data: mapped },
        bubbles: false,
      }),
    );
  }

  resetCustomElement() {
    this._target?.dispatchEvent(
      new CustomEvent("reset", {
        bubbles: false,
      }),
    );
  }

  getEndpoint() {
    return this.src;
  }
}

window.customElements.define("form-restorer", FormRestorer);
