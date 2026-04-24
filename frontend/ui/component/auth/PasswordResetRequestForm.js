import { el } from "/ui/UI.js";
import * as net from "/common/network.js";

export default class PasswordResetRequestForm extends HTMLElement {
  constructor() {
    super();

    this._loading = false;
    this._elements = {};
    this._built = false;

    this.onSubmit = this.onSubmit.bind(this);
  }

  async onSubmit(e) {
    e.preventDefault();

    if (!this._elements.form || this._loading) return;

    const formData = new FormData(this._elements.form);

    this._loading = true;

    const response = await net.send(
      "/api/reset-password/request",
      { method: "POST", body: formData },
      false,
      false,
    );

    this._elements.message.textContent = response?.message;
    this._elements.form.reset?.();

    this._loading = false;
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    this.innerHTML = `
        <form>
            <input type="email" name="email" />
            <button>Jelszóvisszaállítás kérése</button>
        </form>
        <div id="message"></div>
    `;

    this._elements.form = this.querySelector("form");
    this._elements.form.addEventListener("submit", this.onSubmit);
    this._elements.message = this.querySelector("#message");

    this._built = true;
  }
}

window.customElements.define(
  "password-reset-request-form",
  PasswordResetRequestForm,
);
