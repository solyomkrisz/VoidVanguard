import { el } from "/ui/UI.js";
import * as net from "/common/network.js";
import "/ui/component/form/InputGroup.js";
import "/ui/component/validator/EmailInputValidator.js";

export default class PasswordResetRequestForm extends HTMLElement {
  constructor() {
    super();

    this._loading = false;
    this._elements = {};
    this._built = false;
    this._intervalId = null;

    this.onSubmit = this.onSubmit.bind(this);
    this.onSubmitDisable = this.onSubmitDisable.bind(this);
    this.onSubmitEnable = this.onSubmitEnable.bind(this);
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

    if (response?.success) {
      this.startCooldown(response?.result?.retryAfter ?? 300);
    }

    this._loading = false;
  }

  startCooldown(seconds = 300) {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }

    let remaining = seconds;

    const button = this._elements.submitButton;

    button.disabled = true;
    button.textContent = "Próbáld újra " + remaining + " másodperc múlva";

    this._intervalId = setInterval(() => {
      remaining--;

      if (remaining <= 0) {
        clearInterval(this._intervalId);
        this._intervalId = null;
        button.disabled = false;
        button.textContent = "Jelszóvisszaállítás kérése";
        return;
      }

      button.textContent = "Próbáld újra " + remaining + " másodperc múlva";
    }, 1000);
  }

  onSubmitDisable(e) {
    const submitButton = this._elements?.submitButton;
    if (!submitButton) return;
    submitButton.disabled = true;
  }

  onSubmitEnable(e) {
    const submitButton = this._elements?.submitButton;
    if (!submitButton) return;
    submitButton.disabled = false;
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    this.innerHTML = `
      <form>
        <h2>Jelszó visszaállítása</h2>
        <input-group>
          <label>Email cím:</label>
          <email-input-validator>
            <input type="email" name="email" />
          </email-input-validator>
        </input-group>
        <button id="password-reset-request-submit-button">Jelszóvisszaállítás kérése</button>
        <div id="message" class="form-message"></div>
        <a id="back-to-login-link">Vissza a bejelentkezéshez</a>
      </form>
    `;

    this._elements.form = this.querySelector("form");
    this._elements.form.addEventListener("submit", this.onSubmit);
    this._elements.submitButton = this.querySelector("#password-reset-request-submit-button");
    this._elements.message = this.querySelector("#message");

    this.querySelector("#back-to-login-link").addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("password-reset-back", { bubbles: true, composed: true }));
    });

    this._built = true;
  }
}

window.customElements.define(
  "password-reset-request-form",
  PasswordResetRequestForm,
);
