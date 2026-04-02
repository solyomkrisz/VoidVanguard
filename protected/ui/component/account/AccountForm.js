import "/ui/component/form/InputGroup.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import * as net from "/common/network.js";
import { setFieldValue } from "/common/common.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";

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

  constructor() {
    super([path.join(dir, "global.css")]);

    this._elements = {};
    this._built = false;

    this.onSubmit = this.onSubmit.bind(this);
    this.restoreFrom = this.restoreFrom.bind(this);
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
    console.log(formData);
    const response = await net.send("/api/users", {
      method: METHOD[this.action] || "POST",
      body: formData,
    });

    this.onResponse(response);
  }

  onResponse(response) {
    const { success, result, message } = response;
    const { responseMessage } = this._elements;

    if (responseMessage) {
      responseMessage.textContent = "";
    }

    if (responseMessage) {
      responseMessage.textContent = message;
    }

    if (!success) {
      console.error(
        `Failed to ${this.action === "update" ? "modify" : "create"} account.`,
      );

      return;
    }

    console.log(response);

    this.dispatchEvent(
      new CustomEvent(this.getEventName(), {
        detail: { result },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Needed to be compatible with <admin-module> */
  onSignSuccess(formData) {
    this.sendRequest(formData);
  }

  /** Needed to be compatible with <admin-module> */
  onSignError() {
    console.error("Unable to send signed data.");
  }

  build() {
    this.setShadowInnerHTML(`
      <form>
        <input-group class="input-group">
          <label>Felhasználónév</label>
          <input type="text" name="username" placeholder="Felhasználónév" />
        </input-group>

        <input-group class="input-group">
          <label>Email cím</label>
          <input type="email" name="email" placeholder="email@email.email" />
        </input-group>

        <div>
          <div>
            <input type="radio" name="gender" value="0" />
            <label>Férfi</label>
          </div>
          <div>
            <input type="radio" name="gender" value="1" />
            <label>Nő</label>
          </div>
        </div>

        <input-group class="input-group">
          <label>Jelszó</label>
          <input type="password" name="password" placeholder="Jelszó" />
        </input-group>
        
        <input-group class="input-group">
          <label>Jelszó megerősítése</label>
          <input type="password" name="passwordConfirm" placeholder="Jelszó megerősítése" />
        </input-group>

        <button>Fiókadatok módosítása</button>
      </form>
      <div id="message"></div>
    `);

    const form = this.queryShadowSelector("form");
    form.addEventListener("submit", this.onSubmit);

    this._elements.responseMessage = this.queryShadowSelector("#message");

    this.addEventListener("restore", this.restoreFrom);

    this._built = true;
  }

  restoreFrom(e) {
    const data = e.detail?.data;
    const form = this.queryShadowSelector("form");

    for (const [name, value] of Object.entries(data)) {
      const field = form.elements.namedItem(name);
      if (!field) continue;

      if (name === "gender") {
        setFieldValue(field, String(value));
        continue;
      }

      setFieldValue(field, value);
    }
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
