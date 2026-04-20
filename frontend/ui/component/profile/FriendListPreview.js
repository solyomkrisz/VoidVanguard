import * as net from "/common/network.js";
import { on, off } from "/common/eventhub.js";

export default class FriendListPreview extends HTMLElement {
  static get observedAttributes() {
    return ["user-id"];
  }

  get userId() {
    return this.getAttribute("user-id");
  }

  set data(value) {
    this._data = value;
    this.renderContent();
  }

  get data() {
    return this._data;
  }

  constructor() {
    super();

    this._data = null;
    this._built = false;
    this._container = null;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "user-id" && oldValue !== newValue) {
      this.update();
    }
  }

  connectedCallback() {
    this.build();

    // on("login", this.onLogin);
    // on("logout", this.onLogout);
  }

  disconnectedCallback() {
    // off("login", this.onLogin);
    // off("logout", this.onLogout);
  }

  build() {
    if (this._built) return;
    this._container = this.appendChild(document.createElement("div"));
    this._built = true;
  }

  refresh() {
    this.update();
  }

  async update() {
    const response = await net.send(
      `/api/friends/${this.userId}?include=preview`,
    );

    const { success, result, message } = response;

    if (!success || !result) {
      console.error(message);
      this.reset();
      return;
    }

    const data = result.preview;

    if (!data) {
      this.reset();
      return;
    }

    this.data = data;
  }

  renderItem(item) {
    const el = document.createElement("template");

    el.innerHTML = `
      <div class="friend-list-item">
        <img />
        <span>${item.name}</span>
      </div>
    `;

    el.content
      .querySelector(".friend-list-item")
      ?.addEventListener("click", () => {
        this.closest("full-profile")?.setAttribute("user-id", item.user_id);
        window.history.replaceState({}, "", item.user_id);
      });

    return el.content;
  }

  renderContent() {
    if (!Array.isArray(this.data)) {
      console.warn("Invalid data format.");
      return;
    }

    if (!this._container) return;

    this._container.textContent = "";

    for (const item of this.data) {
      this._container.appendChild(this.renderItem(item));
    }
  }

  reset() {
    if (!this._built) return;
    this._container.textContent = "";
  }
}

window.customElements.define("friend-list-preview", FriendListPreview);
