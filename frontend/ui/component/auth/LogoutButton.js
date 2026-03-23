import { element, text } from "/ui/UI.js";

export default class LogoutButton extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (this._initialized) return;
    this.build();
    this._initialized = true;
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

      if (window.VoidVanguard) {
        window.VoidVanguard.user = {};
      }
    });
  }
}

window.customElements.define("logout-button", LogoutButton);
