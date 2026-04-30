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

  get admin() {
    return this.hasAttribute("admin");
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

  onSignSuccess(data) {
    const { formData } = data;
    this.sendRequest(formData);
  }

  onSignError() {
    console.error("Unable to sign data.");
  }

  async sendRequest(formData) {
    // ha tölt az oldal akkor is visszalépünk (LazyItemList-ből jön)
    if (this._hasOngoingUnblock || this._loading) return;
    this._hasOngoingUnblock = true;

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

  async onUnblockUser(e) {
    e.stopPropagation();

    const userId = e?.detail?.userId;
    if (!userId) return;

    const formData = new FormData();
    formData.set("userId", userId);

    if (this.admin) {
      this.dispatchEvent(
        new CustomEvent("sign-request", {
          detail: { formData },
          bubbles: true,
          composed: false,
        }),
      );

      return;
    }

    this.sendRequest(formData);
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

    this.addEventListener("click", this.onClick);

    const userId = window?.VoidVanguard?.user?.id;
    if (isLoggedIn() && isUserSet() && this.hasAttribute("auto") && userId) {
      this.setAttribute("user-id", userId);
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

  renderContent(items, response) {
    if (!Array.isArray(items)) return;

    if (this._page === 1 && items.length === 0) {
      this._container.textContent = "";

      const empty = document.createElement("p");
      empty.className = "block-list-empty";
      empty.textContent = "Nincsenek megjeleníthető felhasználók.";

      this._container.appendChild(empty);
      return;
    }

    super.renderContent(items, response);
  }

  renderItem(item) {
    const el = document.createElement("blocked-user-list-item");
    el.classList.add("blocked-user-row");
    el.data = item;
    return el;
  }

  extractItems(response) {
    return response?.result?.blocks || [];
  }
}

window.customElements.define("blocked-user-list", BlockedUserList);
