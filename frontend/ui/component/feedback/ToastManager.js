/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/feedback/ToastManager.js
 * Szerep: Toast ertesitesek kereset, idoziteset es ujrahasznositasat kezelo komponens.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { element } from "/ui/UI.js";
import { on, off } from "/common/eventhub.js";

export default class ToastManager extends HTMLElement {
  static REQUEST(message, onDone = null, delay = 0, duration = 3000) {
    this.#emit({ message, onDone, delay, duration, variant: "info" });
  }

  static SUCCESS(message, onDone = null, delay = 0, duration = 3000) {
    this.#emit({ message, onDone, delay, duration, variant: "success" });
  }

  static ERROR(message, onDone = null, delay = 0, duration = 3000) {
    this.#emit({ message, onDone, delay, duration, variant: "error" });
  }

  static #emit({ message, onDone, delay = 0, duration = 3000, variant = "info" }) {
    // A statikus helper egy kozos toast-request esemenyt kuld, hogy ne kelljen konkret peldanyt keresni.
    document.dispatchEvent(
      new CustomEvent("toast-request", {
        detail: {
          toast: { message, delay, duration, variant },
          onDone,
        },
      }),
    );
  }

  get eventControlled() {
    return this.hasAttribute("event-controlled");
  }

  constructor() {
    super();

    this.toasts = [];

    this.onToastRequest = this.onToastRequest.bind(this);
  }

  connectedCallback() {
    this._initialized = true;

    if (this.eventControlled) {
      on("toast-request", this.onToastRequest);
    }
  }

  disconnectedCallback() {
    off("toast-request", this.onToastRequest);
  }

  onToastRequest(e) {
    const toast = e?.detail?.toast;

    if (!toast) {
      e.detail.onDone(false);
      return;
    }

    this.schedule(
      toast.message,
      toast.delay ?? 1000,
      toast.duration ?? 3000,
      toast.variant ?? "info",
    );

    if (typeof e?.detail?.onDone === "function") {
      e.detail.onDone(true);
    }
  }

  create() {
    return this.appendChild(element("div").attr("class", "toast hidden"));
  }

  normalizeVariant(variant) {
    if (variant === "success" || variant === "error") {
      return variant;
    }

    return "info";
  }

  schedule(message, delay = 1000, duration = 3000, variant = "info") {
    if (this.toasts.length > 10) this.toasts.length = 10;

    setTimeout(() => {
      // A korabban hasznalt toast DOM-elemeket ujrahasznositjuk, hogy sok uzenetnel se nojon a DOM feleslegesen.
      const toast = this.toasts.pop() || this.create();
      const normalizedVariant = this.normalizeVariant(variant);

      toast.className = `toast toast-${normalizedVariant} hidden`;
      toast.textContent = message;

      this.appendChild(toast);
      toast.offsetWidth;
      toast.classList.remove("hidden");

      setTimeout(() => {
        toast.classList.add("hidden");

        toast.addEventListener(
          "transitionend",
          () => {
            toast.remove();
            this.toasts.push(toast);
          },
          { once: true },
        );
      }, duration);
    }, delay);
  }
}

window.customElements.define("toast-manager", ToastManager);
