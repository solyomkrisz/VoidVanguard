import LazyItemList from "/ui/component/data/LazyItemList.js";
import { isLoggedIn, isUserSet } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import "/ui/component/account/BlockedUserListItem.js";
import * as net from "/common/network.js";

export default class BlockedUserList extends LazyItemList {
  static get observedAttributes() {
    return ["user-id"];
  }

  get userId() {
    return this.getAttribute("user-id");
  }

  constructor() {
    super();

    this._hasOngoingUnblock = false;
    this.onUnblockUser = this.onUnblockUser.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  onLogin(e) {
    this.refresh();
  }

  onLogout(e) {
    this.refresh();
  }

  async onUnblockUser(e) {
    e.stopPropagation();

    // ha tölt az oldal akkor is visszalépünk (LazyItemList-ből jön)
    if (this._hasOngoingUnblock || this._loading) return;

    const userId = e?.detail?.userId;
    if (!userId) return;

    this._hasOngoingUnblock = true;

    const formData = new FormData();
    formData.set("userId", userId);

    const response = await net.send("/api/blocks", {
      method: "DELETE",
      body: formData,
    });

    if (!response?.success) {
      console.error("Unable to unblock user: " + response?.message);
      this._hasOngoingUnblock = false;
      return;
    }

    console.log("Successfully unblocked user: " + response?.message);
    this._hasOngoingUnblock = false;

    this.partialRefresh();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // super.attributeChangedCallback?.(name, oldValue, newValue);

    if (!this._built) {
      this._deferredAttributes.set(name, newValue);
      return;
    }

    if (name === "user-id" && oldValue !== newValue) {
      console.warn(
        `${name} changed from [${oldValue}] to [${newValue}] when this._built was`,
        this._built,
      );

      if (newValue) {
        this.setAttribute("src", `/api/blocks?targetId=${newValue}`);
        this.refresh();
      } else {
        this.reset();
      }
    }
  }

  connectedCallback() {
    super.connectedCallback?.();

    if (isLoggedIn() && isUserSet() && this.hasAttribute("auto")) {
      this.setAttribute("user-id", window.VoidVanguard.user.id);
    }

    this.addEventListener("unblock-user", this.onUnblockUser);
    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this.removeEventListener("unblock-user", this.onUnblockUser);
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  renderItem(item) {
    const el = document.createElement("blocked-user-list-item");
    el.data = item;
    return el;
  }

  extractItems(response) {
    return response?.result?.blocks || [];
  }
}

window.customElements.define("blocked-user-list", BlockedUserList);
