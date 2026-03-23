import { isLoggedIn } from "/common/common.js";
import * as net from "/common/network.js";

export default class BlockActionButton extends HTMLElement {
  static get observedAttributes() {
    return ["user-id"];
  }

  set userId(value) {
    this.setAttribute("user-id", value);
  }

  get userId() {
    return this.getAttribute("user-id");
  }

  get blockStatus() {
    return this._blockStatus;
  }

  set blockStatus(value) {
    if (this._blockStatus === value) {
      return;
    }

    this._blockStatus = value;
    this.updateButtonText();
  }

  constructor() {
    super();
    this._elements = {};
    this._blockStatus = null;
    this._rendered = false;

    this.sendUserAction = this.sendUserAction.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "user-id" && oldValue !== newValue) {
      this.updateVisibility();
      this.updateBlockStatus();
    }
  }

  connectedCallback() {
    this.render();

    document.addEventListener("login", this.onLogin);
    document.addEventListener("logout", this.onLogout);

    this.updateVisibility();
    this.updateBlockStatus();
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
        this.updateBlockStatus();
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

    const response = await net.send("/api/blocks", { method, body: formData });

    this._elements.button.disabled = false;

    if (!response.success) {
      return;
    }

    await this.updateBlockStatus();

    this.dispatchEvent(
      new CustomEvent("block-status-change", {
        detail: {
          userId: this.userId,
        },
      }),
    );
  }

  async updateBlockStatus() {
    if (!this.userId || this.getVisibility()) {
      return;
    }

    const currentUserId = this.userId;

    const response = await net.send(
      `/api/blocks/${currentUserId}?include=status`,
    );

    if (currentUserId !== this.userId) return;

    const { success, result } = response;

    if (!success || !result) {
      return;
    }

    this.blockStatus = result.status;
  }

  updateButtonText() {
    const button = this._elements.button;

    if (!button) {
      return;
    }

    let text;

    switch (this.blockStatus) {
      case "you-blocked":
        text = "Tiltás feloldása";
        break;
      case "got-blocked":
        text = "Felhasználó letiltása";
        break;
      case "not-blocked":
        text = "Felhasználó letiltása";
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
    if (!this.blockStatus) {
      return null;
    }

    switch (this.blockStatus) {
      case "you-blocked":
        return "DELETE";
      case "got-blocked":
        return "POST";
      case "not-blocked":
        return "POST";
      default:
        return null;
    }
  }
}

window.customElements.define("block-action-button", BlockActionButton);
