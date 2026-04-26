import { isLoggedIn, logout } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import { element, text } from "/ui/UI.js";
import * as net from "/common/network.js";

export default class DestroyAllSessionsButton extends HTMLElement {
  constructor() {
    super();

    this._elements = {};
    this._built = false;

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
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

  build() {
    const button = this.appendChild(
      element("button", text("Kijelentkezés mindenhonnan")),
    );

    button.addEventListener("click", async () => {
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
        window.top.location.reload();
      }
    });

    if (!isLoggedIn()) button.hidden = true;

    this._elements.button = button;

    this._built = true;
  }
}

window.customElements.define(
  "destroy-all-sessions-button",
  DestroyAllSessionsButton,
);
