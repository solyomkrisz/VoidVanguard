import LazyItemList from "/ui/component/data/LazyItemList.js";
import { on, off } from "/common/eventhub.js";
import { isLoggedIn, isUserSet } from "/common/common.js";
import * as net from "/common/network.js";
import "/ui/component/profile/FriendListItem.js";
import NetworkErrorHandler from "/common/NetworkErrorHandler.js";

const CONTROL_MAP = {
  pending: {
    incoming: ["accept", "deny", "block"],
    outgoing: ["cancel", "block"],
  },
  accepted: {
    both: ["delete", "block"],
  },
};

function getCurrentUserId() {
  return window?.VoidVanguard?.user?.id || null;
}

function normalizeFriendUserId(item) {
  return item?.user_id || null;
}

export default class FriendListFull extends LazyItemList {
  static get observedAttributes() {
    return ["user-id"];
  }

  get filter() {
    return this.getAttribute("filter");
  }

  get filterConfig() {
    const value = this.getAttribute("filter");

    if (!value) {
      return {
        status: "accepted",
        direction: "both",
      };
    }

    const parsed = Object.fromEntries(
      value.split("&").map((pair) => {
        const [key, value] = pair.split("=");
        return [key, value];
      }),
    );

    return {
      status: parsed.status ?? "accepted",
      direction: parsed.direction ?? "both",
    };
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

    const userId = e?.detail?.userId || e?.target?.friend?.user_id || null;

    if (!userId) {
      console.error(
        "Missing or invalid userId for relationship action:",
        e.type,
        e?.detail,
      );
      return;
    }

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
      case "friend-accept":
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
        case "friend-accept":
          url = "/api/friends";
          method = "PATCH";
          break;

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

      if (NetworkErrorHandler.handle(response)) {
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
    const userId = getCurrentUserId();

    if (this.hasAttribute("auto") && !this.userId && userId) {
      this.setAttribute("user-id", userId);
    }

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

    if (!this._built) {
      this._deferredAttributes.set(name, newValue);
      return;
    }

    if (name === "user-id" && oldValue !== newValue) {
      if (newValue) {
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

        this.setAttribute("src", url);
        this.refresh();
      } else {
        this.reset();
      }
    }
  }

  connectedCallback() {
    super.connectedCallback?.();

    this.addEventListener("friend-accept", this.onRelationshipModification);
    this.addEventListener("friend-delete", this.onRelationshipModification);
    this.addEventListener("user-block", this.onRelationshipModification);

    on("login", this.onLogin);
    on("logout", this.onLogout);

    const userId = getCurrentUserId();
    if (isLoggedIn() && isUserSet() && this.hasAttribute("auto") && userId) {
      this.setAttribute("user-id", userId);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this.removeEventListener("friend-accept", this.onRelationshipModification);
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

  getControlsForFilter() {
    const { status, direction } = this.filterConfig;

    const statusConfig = CONTROL_MAP[status];
    if (!statusConfig) return [];

    return statusConfig[direction] || statusConfig.any || [];
  }

  renderItem(item) {
    const userId = normalizeFriendUserId(item);

    const el = document.createElement("friend-list-item");
    el.friend = item;

    const controls = this.getControlsForFilter().join(" ");
    el.setAttribute("controls", controls);

    const _shouldPersonalize = this.shouldPersonalize();
    this._personalized = _shouldPersonalize;
    el.changePersonalization(_shouldPersonalize);

    if (userId) {
      this._byUserId.set(userId, el);
    }

    return el;
  }

  renderContent(items, response) {
    if (!Array.isArray(items)) return;

    if (this._page === 1 && items.length === 0) {
      this._container.textContent = "";

      const empty = document.createElement("p");
      empty.className = "friend-list-empty";
      empty.textContent = "Nincsenek megjeleníthető barátok.";

      this._container.appendChild(empty);
      return;
    }

    super.renderContent(items, response);
  }

  executeRequest(url) {
    return net.send(url, { method: "GET" }, isLoggedIn());
  }

  extractItems(response) {
    return response?.result?.friends;
  }
}

window.customElements.define("friend-list-full", FriendListFull);
