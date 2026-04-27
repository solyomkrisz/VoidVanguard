import LazyItemList from "/ui/component/data/LazyItemList.js";
import { isLoggedIn, isUserSet, logout } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import "/ui/component/account/TokenListItem.js";
import * as net from "/common/network.js";
import ToastManager from "/ui/component/feedback/ToastManager.js";

export default class ActiveRefreshTokenList extends LazyItemList {
  constructor() {
    super();

    this._hasOngoingSessionDestroy = false;

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onSessionDestroy = this.onSessionDestroy.bind(this);
  }

  onLogin(e) {
    this.refresh();
  }

  onLogout(e) {
    this.refresh();
  }

  async onSessionDestroy(e) {
    const id = e?.detail?.id;
    if (!id || this._hasOngoingSessionDestroy || this._loading) return;
    this._hasOngoingSessionDestroy = true;

    const response = await net.send("/api/tokens/" + id, {
      method: "DELETE",
    });

    if (!response?.success) {
      ToastManager.REQUEST("Nem sikerült a kívánt munkamenet felfüggesztése.");
      this._hasOngoingSessionDestroy = false;
      return;
    }

    ToastManager.REQUEST("Munkamenet sikeresen felfüggesztve.");
    this._hasOngoingSessionDestroy = false;

    if (response?.result?.logout) {
      await logout();
      return;
    }

    this.partialRefresh();
  }

  connectedCallback() {
    super.connectedCallback?.();

    this.addEventListener("session-destroy", this.onSessionDestroy);

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this.removeEventListener("session-destroy", this.onSessionDestroy);

    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  renderItem(item) {
    const el = document.createElement("token-list-item");
    el.data = item;
    return el;
  }

  extractItems(response) {
    return response?.result?.tokens || [];
  }
}

window.customElements.define(
  "active-refresh-token-list",
  ActiveRefreshTokenList,
);
