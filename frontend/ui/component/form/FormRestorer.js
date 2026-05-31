/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/form/FormRestorer.js
 * Szerep: API-rol erkezo adatok visszatoltese formokba vagy mas custom elementekbe.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { setFieldValue } from "/common/common.js";
import * as net from "/common/network.js";
import NetworkErrorHandler from "/common/NetworkErrorHandler.js";

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

    // Ezzel jelezzuk, hogy ez a legfrissebb betoltes; a kesobbi valaszok a regebbieket felulirhatjak.
    const token = Symbol();
    this._loadToken = token;

    const response = await net.send(url);

    if (this._loadToken !== token) {
      return;
    }

    if (
      NetworkErrorHandler.handle(response, {
        strict: true,
        context: "FormRestorer.load",
      })
    ) {
      return;
    }

    this._data = response?.result;

    // A nyers API-objektumot a konkret form-mezokre forditjuk le.
    const mapped = this.mapDataToFields(response?.result);
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
      // Ha nincs kulon mapping, csak azokat a mezoket visszuk tovabb, amiknek van megfelelo form fieldje.
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

    // Ha a cel maga is custom element, akkor nem kozvetlenul irogatjuk a DOM-jat,
    // hanem egy restore esemenyen keresztul atadjuk neki a visszatoltott adatokat.
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
