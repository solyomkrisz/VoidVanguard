import { el } from "/ui/UI.js";
import * as net from "/common/network.js";
import "/ui/component/form/InputGroup.js";
import "/ui/component/validator/PasswordInputValidator.js";
import InputValidator from "/ui/component/form/InputValidator.js";

function getResetToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  return token;
}

export default class PasswordResetForm extends HTMLElement {
  constructor() {
    super();

    this._loading = false;
    this._elements = {};
    this._built = false;

    this.onSubmit = this.onSubmit.bind(this);
    this.onSubmitDisable = this.onSubmitDisable.bind(this);
    this.onSubmitEnable = this.onSubmitEnable.bind(this);
  }

  async onSubmit(e) {
    e.preventDefault();

    if (!this._elements.form || this._loading) return;

    const resetToken = getResetToken();
    if (!resetToken) return;

    const result = InputValidator.RUN_ALL(this._elements.form);
    if (!result) {
      return;
    }

    const formData = new FormData(this._elements.form);
    formData.set("token", resetToken);

    this._loading = true;

    const response = await net.send(
      "/api/reset-password/confirm",
      { method: "POST", body: formData },
      false,
      false,
    );

    if (!response?.success) {
      this._elements.message.textContent = response?.message;
      this._elements.form.reset?.();
      this._loading = false;

      this._elements.form.addEventListener(
        "input",
        () => {
          this._elements.message.textContent = "";
        },
        { once: true },
      );

      return;
    }

    this._loading = false;

    window.location.href = "/";
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
        <h2>Új jelszó beállítása</h2>
        <input-group>
          <label>Új jelszó</label>
          <password-input-validator disable-on-invalid="#password-reset-form-submit-button">
            <input type="password" name="password" />
          </password-input-validator>
        </input-group>
        <input-group>
          <label>Jelszó megerősítése</label>
          <password-input-validator disable-on-invalid="#password-reset-form-submit-button">
            <input type="password" name="passwordConfirm" />
          </password-input-validator>
        </input-group>
        <button id="password-reset-form-submit-button">Jelszó beállítása</button>
        <div id="message" class="form-message"></div>
      </form>
    `;

    this._elements.form = this.querySelector("form");
    this._elements.form.addEventListener("submit", this.onSubmit);
    this._elements.submitButton = this.querySelector("button");
    this._elements.message = this.querySelector("#message");

    this._built = true;
  }
}

window.customElements.define("password-reset-form", PasswordResetForm);
