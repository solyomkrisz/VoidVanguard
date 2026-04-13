import "/ui/component/form/InputGroup.js";
import "/ui/component/validator/DisplayNameInputValidator.js";
import "/ui/component/validator/DescriptionInputValidator.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import * as net from "/common/network.js";
import { setFieldValue } from "/common/common.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";

const METHOD = {
  create: "POST",
  update: "PATCH",
};

export default class ProfileForm extends BaseCustomElement {
  set action(value) {
    const oldValue = this.getAttribute("action");

    if (value !== oldValue) {
      this.setAttribute("action", value);
      this.update();
    }
  }

  get action() {
    return this.getAttribute("action");
  }

  get admin() {
    return this.hasAttribute("admin");
  }

  get selfSign() {
    return this.hasAttribute("self-sign");
  }

  constructor() {
    super([path.join(dir, "global.css")]);

    this._elements = {};
    this._built = false;

    this.onSubmit = this.onSubmit.bind(this);
    this.restoreFrom = this.restoreFrom.bind(this);
    this.resetForm = this.resetForm.bind(this);
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
  }

  async onSubmit(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    /** Needed to be compatible with <admin-module> */
    if (this.admin) {
      if (this.selfSign) {
        const targetUserId =
          this.closest("full-profile")?.getAttribute("user-id");
        if (!targetUserId) return;

        formData.append("targetUserId", targetUserId);
        this.sendRequest(formData);

        return;
      }

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
    const response = await net.send("/api/profiles", {
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
        `Failed to ${this.action === "update" ? "modify" : "create"} profile.`,
      );

      return;
    }

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
  onSignError() {
    console.error("Unable to send signed data");
  }

  update() {
    const elements = this._elements;
    const button = elements.button;
    if (button) {
      button.textContent = this.updateButtonText();
    }
  }

  build() {
    this.setShadowInnerHTML(`
      <form>
        <input-group class="input-group">
          <label>Profilnév</label>
          <display-name-input-validator>
            <input type="text" name="display_name" placeholder="Név123" />
          </display-name-input-validator>
        </input-group>

        <input-group class="input-group">
          <label>Leírás</label>
          <description-input-validator>
            <textarea name="description" placeholder="Ez a profilom..."></textarea>
          </description-input-validator>
        </input-group>
        
        <input-group class="input-group">
          <label>Láthatóság</label>
          <select name="visibility">
            <option value="public">Nyilvános</option>
            <option value="friends-only">Csak barátok</option>
          </select>
        </input-group>

        <button>Profil létrehozása</button>
      </form>
      <div id="message"></div>
    `);

    const form = this.queryShadowSelector("form");
    form.addEventListener("submit", this.onSubmit);

    this._elements.form = form;
    this._elements.button = this.queryShadowSelector("button");
    this._elements.responseMessage = this.queryShadowSelector("#message");

    this.addEventListener("restore", this.restoreFrom);
    this.addEventListener("reset", this.resetForm);

    this._built = true;
  }

  restoreFrom(e) {
    const data = e.detail?.data;
    const form = this.queryShadowSelector("form");

    data && (this.action = "update");

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
        return "profile-update";
      case "create":
      default:
        return "profile-create";
    }
  }

  updateButtonText() {
    switch (this.action) {
      case "update":
        return "Profil módosítása";
      case "create":
      default:
        return "Profil létrehozása";
    }
  }
}

window.customElements.define("profile-form", ProfileForm);
