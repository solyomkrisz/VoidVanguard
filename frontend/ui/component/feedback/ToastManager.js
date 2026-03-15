import { element } from "/ui/UI.js";

export default class ToastManager extends HTMLElement {
  constructor() {
    super();
    this.toasts = [];
  }

  connectedCallback() {
    this._initialized = true;
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

  onResponse(response) {
    this.schedule(response.message, 0);
  }
}

window.customElements.define("toast-manager", ToastManager);
