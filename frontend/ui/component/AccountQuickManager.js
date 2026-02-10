import * as UI from "../UI.js";
import { path } from "../../common/common.js";
import BaseCustomElement from "./BaseCustomElement.js";
import _ from "./LogoutButton.js";

export default class AccountQuickManager extends BaseCustomElement {
  constructor() {
    super([
      path.join(UI.dir, "global.css"),
      path.join(UI.dir, "accountQuickManager.css"),
    ]);
    this.elements = {};
    this.build();
    this.update = this.update.bind(this);
    this.update();
  }

  connectedCallback() {
    document.addEventListener("login", this.update);
    document.addEventListener("logout", this.update);
  }

  disconnectedCallback() {
    document.removeEventListener("login", this.update);
    document.removeEventListener("logout", this.update);
  }

  build() {
    this.elements.username = this.shadowRoot.appendChild(
      UI.element("span", UI.text("Logged out")),
    );
    this.elements.logout = this.shadowRoot.appendChild(
      UI.element("logout-button"),
    );
  }

  update() {
    console.log(
      "AccountQuickManager-update: Updating account quick manager...",
    );

    const userdata = JSON.parse(sessionStorage.getItem("access_token_decoded"));

    this.elements.username.textContent = userdata?.username ?? "Logged out";
  }
}

window.customElements.define("account-quick-manager", AccountQuickManager);
