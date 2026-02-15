import * as UI from "../UI.js";
import BaseCustomElement from "./BaseCustomElement.js";

export default class LogoutButton extends BaseCustomElement {
  constructor() {
    super();
    this.build();
  }
  build() {
    const button = this.shadowRoot.appendChild(
      UI.element("button", UI.text("Kijelentkezés")),
    );

    button.addEventListener("click", async () => {
      if (!sessionStorage.getItem("access_token")) return;

      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token_decoded");

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

      document.dispatchEvent(
        new CustomEvent("logout", {
          bubbles: false,
        }),
      );
    });
  }
}

window.customElements.define("logout-button", LogoutButton);
