import { dir, element, text } from "../../UI.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import userState from "../../../state/user.js";

export default class LogoutButton extends BaseCustomElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (this._initialized) return;
    this.build();
    this._initialized = true;
  }

  build() {
    const button = this.appendShadowChild(
      element("button", text("Kijelentkezés")),
    );

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

      userState.reset();
    });
  }
}

window.customElements.define("logout-button", LogoutButton);
