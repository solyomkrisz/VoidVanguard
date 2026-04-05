import LazyItemList from "/ui/component/data/LazyItemList.js";
import { on, off } from "/common/eventhub.js";
import * as net from "/common/network.js";
import "/ui/component/profile/FriendListItem.js";

export default class FriendListFull extends LazyItemList {
  static get observedAttributes() {
    return ["user-id"];
  }

  get filter() {
    return this.getAttribute("filter");
  }

  get admin() {
    return this.hasAttribute("admin");
  }

  get userId() {
    return this.getAttribute("user-id");
  }

  constructor() {
    super();

    this._processing = false;
    this._personalized = false;
    this._byUserId = new Map();

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onRelationshipModification =
      this.onRelationshipModification.bind(this);
  }

  onSignSuccess(data) {
    const { type, formData } = data; // by admin-module e.type is saved into e.detail.type, then e.detail is passed here as an argument

    this.handleRelationshipAction(type, formData);
  }

  onSignError() {
    console.error("Unable to send signed data.");
  }

  onRelationshipModification(e) {
    if (this._processing) return;

    const userId = e?.detail?.userId;
    if (!userId) return;

    const formData = new FormData();
    formData.append("userId", userId);

    if (this.admin) {
      this.dispatchEvent(
        new CustomEvent("sign-request", {
          detail: { formData, type: e.type },
          bubbles: true,
          composed: true,
        }),
      );

      return;
    }

    switch (e.type) {
      case "friend-delete":
      case "user-block":
        this.handleRelationshipAction(e.type, formData);
        break;

      default:
        console.warn("Invalid event");
        break;
    }
  }

  async handleRelationshipAction(type, formData) {
    try {
      this._processing = true;

      let url, method;

      switch (type) {
        case "friend-delete":
          url = "/api/friends";
          method = "DELETE";
          break;

        case "user-block":
          url = "/api/blocks";
          method = "POST";
          break;

        default:
          console.warn("Invalid action:", type);
          return;
      }

      const response = await net.send(url, {
        method,
        body: formData,
      });

      const { success, message } = response;

      console.log(message);

      if (!success) {
        console.error(`Action '${type}' failed`);
        return;
      }

      const userId = formData.get("userId");

      const node = this._byUserId.get(userId);
      node?.remove();
      this._byUserId.delete(userId);

      if (this.controls === "pagination") {
        this.reloadCurrentPage();
      }

      this.dispatchEvent(
        new CustomEvent("friend-list-change", {
          detail: { userId: this.userId },
          bubbles: true,
          composed: true,
        }),
      );
    } finally {
      this._processing = false;
    }
  }

  onLogin(e) {
    this.updatePersonalization();
  }

  onLogout(e) {
    this.updatePersonalization();
  }

  shouldPersonalize() {
    return (
      this.hasAttribute("admin") ||
      this.userId === window?.VoidVanguard?.user?.id
    );
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // super.attributeChangedCallback?.(name, oldValue, newValue);

    if (name === "user-id" && oldValue !== newValue && newValue) {
      const params = new URLSearchParams({
        targetId: newValue,
        status: "accepted",
        direction: "both",
      });

      if (this.filter) {
        this.filter.split("&").forEach((pair) => {
          const [key, value] = pair.split("=");

          if (key && value) {
            params.set(key, value);
          }
        });
      }

      const url = `/api/friends?${params.toString()}`;

      // this.setAttribute(
      //   "src",
      //   "/api/friends?targetId=" +
      //     newValue +
      //     (this.filter ? "?filter=" + this.filter : ""),
      // );
      this.setAttribute("src", url);

      this.refresh();
    }
  }

  connectedCallback() {
    super.connectedCallback?.();

    this.addEventListener("friend-delete", this.onRelationshipModification);
    this.addEventListener("user-block", this.onRelationshipModification);

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this.removeEventListener("friend-delete", this.onRelationshipModification);
    this.removeEventListener("user-block", this.onRelationshipModification);

    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  updatePersonalization() {
    const _shouldPersonalize = this.shouldPersonalize();
    if (_shouldPersonalize === this._personalized) return;

    for (const item of this._byUserId.values()) {
      item.changePersonalization?.(_shouldPersonalize);
    }

    this._personalized = _shouldPersonalize;
  }

  renderItem(item) {
    const el = document.createElement("friend-list-item");
    el.friend = item;

    const _shouldPersonalize = this.shouldPersonalize();
    this._personalized = _shouldPersonalize;
    el.changePersonalization(_shouldPersonalize);

    this._byUserId.set(item.user_id, el);

    return el;
  }

  extractItems(response) {
    return response?.result?.friends;
  }
}

window.customElements.define("friend-list-full", FriendListFull);
