import "/ui/component/form/InputGroup.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import * as net from "/common/network.js";
import { setFieldValue } from "/common/common.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import NetworkErrorHandler from "/common/NetworkErrorHandler.js";

import "/ui/component/validator/UsernameInputValidator.js";
import "/ui/component/validator/EmailInputValidator.js";
import "/ui/component/validator/PasswordInputValidator.js";
import ToastManager from "/ui/component/feedback/ToastManager.js";

const _innerHTML = `
<form>
  <input-group class="input-group">
    <label>Felhasználónév</label>
    <username-input-validator can-be-empty>
      <input type="text" name="username" placeholder="Felhasználónév" />
    </username-input-validator>
  </input-group>

  <input-group class="input-group">
    <label>Email cím</label>
    <email-input-validator can-be-empty>
      <input type="email" name="email" placeholder="email@email.email" />
    </email-input-validator>
  </input-group>

  <input-group class="input-group">
    <label>Jelszó</label>
    <password-input-validator can-be-empty>
      <input type="password" name="password" placeholder="Jelszó" />
    </password-input-validator>
  </input-group>
  
  <input-group class="input-group">
    <label>Jelszó megerősítése</label>
    <password-input-validator can-be-empty>
      <input type="password" name="passwordConfirm" placeholder="Jelszó megerősítése" />
    </password-input-validator>
  </input-group>

  <button>Fiókadatok módosítása</button>
</form>
`;

const METHOD = {
  create: "POST",
  update: "PATCH",
};

export default class AccountForm extends BaseCustomElement {
  get action() {
    return this.getAttribute("action");
  }

  get admin() {
    return this.hasAttribute("admin");
  }

  constructor(extraPaths = []) {
    super([
      path.join(dir, "global.css"),
      path.join(dir, "accountForm.css"),
      ...extraPaths,
    ]);

    this._elements = {};
    this._built = false;
    this._innerHTML = _innerHTML;

    this.onSubmit = this.onSubmit.bind(this);
    this.restoreFrom = this.restoreFrom.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.onSubmitDisable = this.onSubmitDisable.bind(this);
    this.onSubmitEnable = this.onSubmitEnable.bind(this);
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
  }

  async onSubmit(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    // If updating and the user didn't specify a new password, we delete the password key from the formData
    // so that the endpoint won't throw error
    if (this.action === "update") {
      if (!formData.get("password")) {
        formData.delete("password");
      }

      if (!formData.get("passwordConfirm")) {
        formData.delete("passwordConfirm");
      }

      // Allow password-only updates even if account fields are currently blank.
      for (const key of ["username", "email"]) {
        const value = formData.get(key);
        if (typeof value === "string" && !value.trim()) {
          formData.delete(key);
        }
      }
    }

    /** Needed to be compatible with <admin-module> */
    if (this.admin) {
      this.dispatchEvent(
        new CustomEvent("sign-request", {
          detail: { formData },
          bubbles: true,
          composed: true,
        }),
      );

      return;
    }

    this.sendRequest(formData);
  }

  async sendRequest(formData) {
    const response = await net.send("/api/users", {
      method: METHOD[this.action] || "POST",
      body: formData,
    });

    this.onResponse(response);
  }

  onResponse(response) {
    const { success, result, message } = response;

    if (NetworkErrorHandler.handle(response)) {
      console.error(
        `Failed to ${this.action === "update" ? "modify" : "create"} account.`,
      );
      return;
    }

    ToastManager.SUCCESS(
      message ||
        (this.action === "update"
          ? "Fiókadatok sikeresen módosítva"
          : "Fiók sikeresen létrehozva"),
    );

    this.dispatchEvent(
      new CustomEvent(this.getEventName(), {
        detail: { result },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Needed to be compatible with <admin-module> */
  onSignSuccess(data) {
    this.sendRequest(data.formData);
  }

  /** Needed to be compatible with <admin-module> */
  onSignError(detail) {
    console.error("Unable to send signed data.");
    ToastManager.ERROR("Nem sikerült az adatok aláíratása");
  }

  build() {
    this.setShadowInnerHTML(this._innerHTML);

    const form = this.queryShadowSelector("form");
    form.addEventListener("submit", this.onSubmit);

    this._elements.form = form;
    this._elements.button = this.queryShadowSelector("button");

    this.addEventListener("restore", this.restoreFrom);
    this.addEventListener("reset", this.resetForm);

    if (this.hasAttribute("with-validator")) {
      this.addEventListener("submit-disable", this.onSubmitDisable);
      this.addEventListener("submit-enable", this.onSubmitEnable);
    }

    this._built = true;
  }

  onSubmitDisable(e) {
    e.stopPropagation();
    this._elements.button.disabled = true;
  }

  onSubmitEnable(e) {
    e.stopPropagation();
    this._elements.button.disabled = false;
  }

  restoreFrom(e) {
    const data = e.detail?.data;
    const form = this.queryShadowSelector("form");

    for (const [name, value] of Object.entries(data)) {
      const field = form.elements.namedItem(name);
      if (!field) continue;

      setFieldValue(field, value);
    }
  }

  resetForm() {
    this._elements.form?.reset?.();
  }

  getEventName() {
    switch (this.action) {
      case "update":
        return "account-update";
      case "create":
      default:
        return "account-create";
    }
  }

  updateButtonText() {
    switch (this.action) {
      case "update":
        return "Fiókadatok módosítása";
      case "create":
      default:
        return "Fiók létrehozása";
    }
  }
}

window.customElements.define("account-form", AccountForm);
