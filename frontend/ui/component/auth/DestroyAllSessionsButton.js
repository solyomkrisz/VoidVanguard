import { isLoggedIn, logout } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import { element, text } from "/ui/UI.js";
import * as net from "/common/network.js";
import AppModal from "/ui/component/feedback/AppModal.js";

export default class DestroyAllSessionsButton extends HTMLElement {
  constructor() {
    super();

    this._elements = {};
    this._built = false;
    this._pending = false;
    this._modal = document.createElement("app-modal");

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  async connectedCallback() {
    if (this._built) return;
    this.build();

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  onLogin(e) {
    const button = this._elements.button;
    if (!button) return;

    button.hidden = false;
  }

  onLogout(e) {
    const button = this._elements.button;
    if (!button) return;

    button.hidden = true;
  }

  async onClick(e) {
    if (this._pending) return;
    this._pending = true;

    const result = await this._modal.open({
      title: "Összes munkamenet felfüggesztése",
      message:
        "Biztosan fel szeretnéd függeszteni az összes aktív munkamenetet?",
      confirmButtonText: "Igen",
      cancelButtonText: "Nem",
    });

    if (!result) {
      this._pending = false;
      return;
    }

    try {
      const response = await net.send("/api/sessions", {
        method: "DELETE",
      });

      localStorage.removeItem("access_token");

      if (!response?.success) {
        throw new Error(`Global logout failed: ${response?.message}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this._pending = false;
      window.top.location.reload();
    }
  }

  build() {
    const button = this.appendChild(
      element("button", text("Kijelentkezés mindenhonnan")),
    );

    button.dataset.sfx = "click_1";
    button.addEventListener("click", this.onClick);

    if (!isLoggedIn()) button.hidden = true;

    this._elements.button = button;

    this._built = true;
  }
}

window.customElements.define(
  "destroy-all-sessions-button",
  DestroyAllSessionsButton,
);
