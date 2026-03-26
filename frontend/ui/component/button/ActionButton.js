import { isLoggedIn } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
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

  set status(value) {
    if (this._status === value) return;
    this._status = value;
    this.updateButtonText();
  }

  get status() {
    return this._status;
  }

  constructor() {
    super();

    this._elements = {};
    this._status = null;
    this._built = false;

    this.sendUserAction = this.sendUserAction.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "user-id" && oldValue !== newValue) {
      this.updateVisibility();
      this.updateStatus();
    }
  }

  connectedCallback() {
    this.build();

    on("login", this.onLogin);
    on("logout", this.onLogout);

    this.updateVisibility();
    this.updateStatus();
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  onLogin() {
    this.updateVisibility();
  }

  onLogout() {
    this.updateVisibility();
  }

  getVisibility() {
    return (
      !isLoggedIn() ||
      (window.VoidVanguard?.user?.id &&
        String(this.userId) === String(window.VoidVanguard.user.id))
    );
  }

  updateVisibility() {
    const button = this._elements.button;
    if (!button) return;

    const hidden = this.getVisibility();

    if (button.hidden !== hidden) {
      button.hidden = hidden;

      if (!hidden) {
        this.updateStatus();
      }
    }
  }

  build() {
    if (this._built) return;

    this.innerHTML = `<button></button>`;

    const button = this.querySelector("button");
    button.addEventListener("click", this.sendUserAction);

    this._elements.button = button;
    this._built = true;
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

    const response = await net.send(this.getEndpoint(), {
      method,
      body: formData,
    });

    this._elements.button.disabled = false;

    if (!response.success) {
      return;
    }

    await this.updateStatus();

    this.dispatchEvent(
      new CustomEvent(this.getEventName(), {
        detail: { userId: this.userId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  async updateStatus() {
    if (!this.userId || this.getVisibility()) {
      return;
    }

    const currentUserId = this.userId;

    const response = await net.send(this.getStatusEndpoint());

    if (currentUserId !== this.userId) return;

    const { success, result } = response;

    if (!success || !result) {
      return;
    }

    this.status = result.status;
  }

  refresh() {
    this.updateStatus();
  }

  getEndpoint() {
    throw new Error("getEndpoint() must be implemented by the subclass!");
  }

  getStatusEndpoint() {
    throw new Error("getStatusEndpoint() must be implemented by the subclass!");
  }

  getEventName() {
    throw new Error("getEventName() must be implemented by the subclass!");
  }

  getBehaviour() {
    throw new Error("getBehaviour() must be implemented by the subclass!");
  }

  updateButtonText() {
    throw new Error("updateButtonText() must be implemented by the subclass!");
  }
}
