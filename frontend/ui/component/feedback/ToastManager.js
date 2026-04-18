import { element } from "/ui/UI.js";
import { on, off } from "/common/eventhub.js";

export default class ToastManager extends HTMLElement {
  static REQUEST(message, onDone = null, delay = 0, duration = 3000) {
    document.dispatchEvent(
      new CustomEvent("toast-request", {
        detail: {
          toast: { message, delay, duration },
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

    this.schedule(toast.message, toast.delay ?? 1000, toast.duration ?? 3000);

    if (typeof e?.detail?.onDone === "function") {
      e.detail.onDone(true);
    }
  }

  create() {
    return this.appendChild(element("div").attr("class", "toast hidden"));
  }

  schedule(message, delay = 1000, duration = 3000) {
    if (this.toasts.length > 10) this.toasts.length = 10;

    setTimeout(() => {
      const toast = this.toasts.pop() || this.create();
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
