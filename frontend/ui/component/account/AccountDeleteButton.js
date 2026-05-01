import { isLoggedIn, logout } from "/common/common.js";
import * as net from "/common/network.js";
import AppModal from "/ui/component/feedback/AppModal.js";
import ToastManager from "/ui/component/feedback/ToastManager.js";
import NetworkErrorHandler from "/common/NetworkErrorHandler.js";

export default class AccountDeleteButton extends HTMLElement {
  constructor() {
    super();

    this._built = false;
    this._pending = false;
    this._modal = document.createElement("app-modal");

    this.onClick = this.onClick.bind(this);
  }

  async onClick(e) {
    console.log(this._pending, !isLoggedIn());
    if (this._pending || !isLoggedIn()) return;
    this._pending = true;

    const result = await this._modal.open({
      title: "Fiók törlése",
      message: "Biztosan törölni szeretnéd a fiókodat?",
      confirmButtonText: "Igen",
      cancelButtonText: "Nem",
    });

    if (!result) {
      this._pending = false;
      return;
    }

    const response = await net.send("/api/users", {
      method: "DELETE",
    });

    if (NetworkErrorHandler.handle(response)) {
      console.warn(`Unable to delete account: ${response?.message ?? ""}`);
      return;
    }

    await logout();
    this._pending = false;
    window.top.location.reload();
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    const button = this.appendChild(document.createElement("button"));
    button.textContent = "Fiók törlése";

    button.addEventListener("click", this.onClick);

    this._built = true;
  }
}

window.customElements.define("account-delete-button", AccountDeleteButton);
