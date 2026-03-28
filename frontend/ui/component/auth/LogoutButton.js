import { isLoggedIn } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import { element, text } from "/ui/UI.js";

export default class LogoutButton extends HTMLElement {
  constructor() {
    super();

    this._elements = {};
    this._built = false;

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
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
    const button = this.appendChild(element("button", text("Kijelentkezés")));

    button.addEventListener("click", async () => {
      if (!localStorage.getItem("access_token")) return;

      localStorage.removeItem("access_token");

      try {
        const response = await fetch("/api/sessions", {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Logout failed:", data.message);
        }
      } catch (error) {
        console.error("Logout error:", error);
      }

      if (window?.VoidVanguard?.user) {
        const oldId = window.VoidVanguard.user?.id;

        window.VoidVanguard.user = {};

        document.dispatchEvent(
          new CustomEvent("logout", {
            detail: {
              oldId,
              newId: null,
            },
          }),
        );
      }
    });

    if (!isLoggedIn()) button.hidden = true;

    this._elements.button = button;

    on("login", this.onLogin);
    on("logout", this.onLogout);

    this._built = true;
  }
}

window.customElements.define("logout-button", LogoutButton);
