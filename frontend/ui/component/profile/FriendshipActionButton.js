import { isLoggedIn } from "/common/common.js";
import * as net from "/common/network.js";

export default class FriendshipActionButton extends HTMLElement {
  static get observedAttributes() {
    return ["user-id"];
  }

  set userId(value) {
    this.setAttribute("user-id", value);
  }

  get userId() {
    return this.getAttribute("user-id");
  }

  get friendshipStatus() {
    return this._friendshipStatus;
  }

  set friendshipStatus(value) {
    if (this._friendshipStatus === value) {
      return;
    }

    this._friendshipStatus = value;
    this.updateButtonText();
  }

  constructor() {
    super();
    this._elements = {};
    this._friendshipStatus = null;
    this._rendered = false;

    this.sendUserAction = this.sendUserAction.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "user-id" && oldValue !== newValue) {
      this.updateVisibility();
      this.updateFriendshipStatus();
    }
  }

  connectedCallback() {
    this.render();

    document.addEventListener("login", this.onLogin);
    document.addEventListener("logout", this.onLogout);

    this.updateVisibility();
    this.updateFriendshipStatus();
  }

  disconnectedCallback() {
    document.removeEventListener("login", this.onLogin);
    document.removeEventListener("logout", this.onLogout);
  }

  onLogin(e) {
    this.updateVisibility();
  }

  onLogout(e) {
    this.updateVisibility();
  }

  getVisibility() {
    const loggedIn = isLoggedIn();

    const ownProfile =
      loggedIn && String(this.userId) === String(window.VoidVanguard.user.id);

    return !loggedIn || ownProfile;
  }

  updateVisibility() {
    const button = this._elements.button;
    if (!button) return;

    const hidden = this.getVisibility();

    if (button.hidden !== hidden) {
      button.hidden = hidden;

      if (!hidden) {
        this.updateFriendshipStatus();
      }
    }
  }

  render() {
    if (this._rendered) return;

    this.innerHTML = `<button></button>`;

    const button = this.querySelector("button");
    button.addEventListener("click", this.sendUserAction);

    this._elements.button = button;
    this._rendered = true;
  }

  async sendUserAction() {
    if (!isLoggedIn()) {
      return;
    }

    const method = this.getBehaviour();

    if (!method) {
      console.error("Invalid action!");
      return;
    }

    this._elements.button.disabled = true;

    const formData = new FormData();
    formData.append("userId", this.userId);

    const response = await net.send("/api/friends", { method, body: formData });

    this._elements.button.disabled = false;

    if (!response.success) {
      return;
    }

    await this.updateFriendshipStatus();

    this.dispatchEvent(
      new CustomEvent("friendship-status-change", {
        detail: {
          userId: this.userId,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  async updateFriendshipStatus() {
    if (!this.userId || this.getVisibility()) {
      return;
    }

    const currentUserId = this.userId;

    const response = await net.send(
      `/api/friends/${currentUserId}?include=status`,
    );

    if (currentUserId !== this.userId) return;

    const { success, result } = response;

    if (!success || !result) {
      return;
    }

    this.friendshipStatus = result.status;
  }

  updateButtonText() {
    const button = this._elements.button;

    if (!button) {
      return;
    }

    let text;

    switch (this.friendshipStatus) {
      case "accepted":
        text = "Barát eltávolítása";
        break;
      case "not-friends":
        text = "Barát hozzáadása";
        break;
      case "incoming":
        text = "Barátkérelem elfogadása";
        break;
      case "sent":
        text = "Barátkérelem törlése";
        break;
      default:
        text = null;
        break;
    }

    if (!text) {
      button.textContent = "";
      return;
    }

    button.textContent = text;
  }

  getBehaviour() {
    if (!this.friendshipStatus) {
      return null;
    }

    switch (this.friendshipStatus) {
      case "not-friends":
        return "POST";
      case "incoming":
        return "PATCH";
      case "accepted":
        return "DELETE";
      case "sent":
        return "DELETE";
      default:
        return null;
    }
  }
}

window.customElements.define(
  "friendship-action-button",
  FriendshipActionButton,
);
