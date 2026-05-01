import "/ui/component/profile/FriendshipActionButton.js";
import "/ui/component/profile/BlockActionButton.js";
import { el } from "/ui/UI.js";
import * as net from "/common/network.js";

export default class SearchBarResultItem extends HTMLElement {
  get searchBar() {
    return this.closest("search-bar-result-list");
  }

  get useEvent() {
    return this.hasAttribute("use-event");
  }

  set data(value) {
    this._data = value;

    if (this.isConnected) {
      this.update();
    }
  }

  get data() {
    return this._data;
  }

  constructor() {
    super();

    this.elements = {};
    this._data = {};
    this._relationship = {
      blockStatus: null,
      friendshipStatus: null,
    };
    this._built = false;

    this.onDisguise = this.onDisguise.bind(this);
    this.onProfileAction = this.onProfileAction.bind(this);
    this.onFriendButtonClick = this.onFriendButtonClick.bind(this);
    this.onBlockButtonClick = this.onBlockButtonClick.bind(this);
  }

  connectedCallback() {
    this.build();
    this.update();
  }

  onDisguise() {
    const info = document.querySelector("#disguise-info");
    if (info) {
      const username = this.data?.username ? `@${this.data.username}` : "";
      const displayName = this.data?.display_name
        ? ` - ${this.data.display_name}`
        : "";
      const id = this.data?.id ? ` (${this.data.id})` : "";

      info.textContent = `Álca: ${username}${displayName}${id}`.trim();
    }

    if (this.useEvent) {
      this.dispatchEvent(
        new CustomEvent("target-user-change", {
          detail: {
            targetUserId: this.data.id,
          },
          bubbles: true,
          composed: true,
        }),
      );

      return;
    }

    const modules = document.querySelectorAll("admin-module");

    for (const module of modules) {
      module.setAttribute("target-user-id", this.data.id);
    }

    this.searchBar?.setAttribute("target-user-id", this.data.id);
  }

  onProfileAction() {
    const fullProfile = document.querySelector("full-profile");
    if (!fullProfile) return;

    const headerText = document.querySelector(
      "#full-profile-target-create-text",
    );

    const wantsCreateProfile = !this.data?.display_name;
    if (wantsCreateProfile) {
      fullProfile.setAttribute("open-profile-create", "");

      if (headerText) {
        const username = this.data?.username || this.data?.id || "";
        headerText.textContent = `Profil létrehozása @${username} számára`;
        headerText.hidden = false;
      }
    } else {
      fullProfile.removeAttribute("open-profile-create");

      if (headerText) {
        headerText.textContent = "";
        headerText.hidden = true;
      }
    }

    const currentUserId = fullProfile.getAttribute("user-id");
    const nextUserId = String(this.data.id || "");

    fullProfile.setAttribute("user-id", nextUserId);

    if (String(currentUserId || "") === nextUserId) {
      void fullProfile.update?.({ origin: "admin-profile-action" });
    }

    const container = document.querySelector("#full-profile-container");
    if (!container) return;

    container.classList.add("active");
  }

  async sendRelationshipChangeRequest(url, method) {
    const formData = new FormData();

    formData.append("userId", this.data.id);

    const targetUserId = this.searchBar?.getAttribute("target-user-id");
    if (targetUserId) {
      formData.append("targetUserId", targetUserId);
    }

    const response = await net.send(url, {
      method,
      body: formData,
    });

    const { success, message } = response;

    if (!success) {
      console.error(`Unable to modify relationship: ${message}`);
      this.syncRelationshipButtons();
      return;
    }

    this.syncRelationshipButtons();
    this.notify();
  }

  notify() {
    const nodes = Array.from(
      document.querySelectorAll("friend-list-full[user-id]"),
    ).concat(Array.from("blocked-user-list[user-id]"));

    for (const node of nodes) {
      node.partialRefresh?.();
    }
  }

  async onFriendButtonClick() {
    if (!this.data.id) return;

    let method;

    switch (this._relationship.friendshipStatus) {
      case "not-friends":
        method = "POST";
        break;
      case "received":
        method = "PATCH";
        break;
      case "accepted":
      case "sent":
        method = "DELETE";
        break;
      default:
        return;
    }

    this.sendRelationshipChangeRequest("/api/friends", method);
  }

  async onBlockButtonClick() {
    if (!this.data.id) return;

    let method;

    switch (this._relationship.blockStatus) {
      case "you-blocked":
      case "both-blocked":
        method = "DELETE";
        break;
      case "got-blocked":
      case "not-blocked":
        method = "POST";
        break;
      default:
        return;
    }

    this.sendRelationshipChangeRequest("/api/blocks", method);
  }

  build() {
    if (this._built) return;

    const img = this.appendChild(el("img"));
    const username = el("div", { class: "username" });
    const displayName = el("div", { class: "display-name", hidden: true });
    const disguiseButton = el(
      "button",
      { onClick: this.onDisguise, "data-sfx": "click_1" },
      ["Álcázás mint"],
    );
    const profileButton = el("button", {
      onClick: this.onProfileAction,
      "data-sfx": "click_1",
    });
    const friendButton = el(
      "button",
      { onClick: this.onFriendButtonClick, "data-sfx": "click_1" },
      ["Barát hozzáadása"],
    );
    const blockButton = el(
      "button",
      { onClick: this.onBlockButtonClick, "data-sfx": "click_1" },
      ["Felhasználó letiltása"],
    );

    this._elements = {
      img,
      username,
      displayName,
      disguiseButton,
      profileButton,
      friendButton,
      blockButton,
    };

    this.appendChild(img);
    this.appendChild(el("div", {}, [displayName, username]));
    this.appendChild(el("div", {}, [disguiseButton, profileButton]));
    this.appendChild(el("div", {}, [friendButton, blockButton]));

    this._built = true;
  }

  async getStatus(baseUrl) {
    const url = new URL(baseUrl, window.location.origin);

    const targetUserId = this.searchBar?.getAttribute("target-user-id");
    if (targetUserId) {
      url.searchParams.set("targetUserId", targetUserId);
    }

    url.searchParams.set("include", "status");

    const response = await net.send(url);

    const { success, result, message } = response;

    if (!success || !result || !result.status) {
      console.error(`Unable to update relationship status: ${message}`);
      return null;
    }

    return result.status;
  }

  async updateRelationshipStatus(name) {
    if (name === "friendship" || name === "both") {
      const status = await this.getStatus(`/api/friends/${this.data.id}`);
      this._relationship.friendshipStatus = status;
    }

    if (name === "block" || name === "both") {
      const status = await this.getStatus(`/api/blocks/${this.data.id}`);
      this._relationship.blockStatus = status;
    }
  }

  async syncRelationshipButtons() {
    const prevFriendStatus = this._relationship.friendshipStatus;
    const prevBlockStatus = this._relationship.blockStatus;

    await this.updateRelationshipStatus("both");

    if (prevFriendStatus !== this._relationship.friendshipStatus) {
      const button = this._elements.friendButton;

      console.log(this._relationship.friendshipStatus);

      switch (this._relationship.friendshipStatus) {
        case "accepted":
          button.textContent = "Barát eltávolítása";
          break;
        case "not-friends":
          button.textContent = "Barát hozzáadása";
          break;
        case "received":
          button.textContent = "Barátkérelem elfogadása";
          break;
        case "sent":
          button.textContent = "Barátkérelem törlése";
          break;
        default:
          button.textContent = "";
      }
    }

    if (prevBlockStatus !== this._relationship.blockStatus) {
      const button = this._elements.blockButton;

      switch (this._relationship.blockStatus) {
        case "you-blocked":
        case "both-blocked":
          button.textContent = "Tiltás feloldása";
          break;
        default:
          button.textContent = "Felhasználó letiltása";
          break;
      }
    }

    const targetUserId = this.searchBar?.getAttribute("target-user-id");
    const isTargetUser =
      targetUserId != null && String(targetUserId) === String(this.data.id);

    this._elements.disguiseButton.hidden = isTargetUser;

    if (isTargetUser) {
      this._elements.friendButton.hidden = true;
      this._elements.blockButton.hidden = true;
    } else {
      this._elements.friendButton.hidden = false;
      this._elements.blockButton.hidden = false;

      if (this._relationship.blockStatus !== "not-blocked") {
        this._elements.friendButton.hidden = true;
      } else {
        this._elements.friendButton.hidden = false;
      }
    }
  }

  update() {
    if (!this._built) {
      this.build();
    }

    const { img, username, displayName, profileButton } = this._elements;

    username.textContent = `@${this.data.username}`;

    if (this.data.avatar) {
      img.src = this.data.avatar;
    } else {
      img.classList.add("no-profile-avatar");
    }

    if (this.data.display_name) {
      if (displayName.hidden) {
        displayName.hidden = false;
      }

      displayName.textContent = this.data.display_name;
      profileButton.textContent = "Profil megnyitása";
    } else {
      profileButton.textContent = "Profil létrehozása";
    }

    this.syncRelationshipButtons();
  }
}

window.customElements.define("search-bar-result-item", SearchBarResultItem);
