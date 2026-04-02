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
    if (
      (name === "src" || name === "user-id") &&
      oldValue !== newValue &&
      newValue
    ) {
      this.load();
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

  restore(mapped) {
    if ((!this._target) instanceof HTMLFormElement) {
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

    this._target.dispatchEvent(
      new CustomEvent("form-restore", {
        detail: { data: mapped },
        bubbles: false,
      }),
    );
  }

  getEndpoint() {
    return this.src;
  }
}

window.customElements.define("form-restorer", FormRestorer);
