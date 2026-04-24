import { el } from "/ui/UI.js";
import * as net from "/common/network.js";
import "/ui/component/form/InputGroup.js";

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
  }

  async onSubmit(e) {
    e.preventDefault();

    if (!this._elements.form || this._loading) return;

    const resetToken = getResetToken();
    if (!resetToken) return;

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

      return;
    }

    this._loading = false;

    window.location.href = "/";
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    this.innerHTML = `
      <form>
        <input-group>
          <label>Új jelszó</label>
          <input type="password" name="password" />
        </input-group>
        <input-group>
          <label>Jelszó megerősítése</label>
          <input type="password" name="passwordConfirm" />
        </input-group>
        <button>Jelszó beállítása</button>
      </form>
      <div id="message"></div>
    `;

    this._elements.form = this.querySelector("form");
    this._elements.form.addEventListener("submit", this.onSubmit);
    this._elements.message = this.querySelector("#message");

    this._built = true;
  }
}

window.customElements.define("password-reset-form", PasswordResetForm);
