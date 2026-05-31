/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/profile/FriendListPreview.js
 * Szerep: Ismeroslista rovid elonezete a profiloldalon.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as net from "/common/network.js";
import { on, off } from "/common/eventhub.js";
import { isLoggedIn } from "/common/common.js";
import NetworkErrorHandler from "/common/NetworkErrorHandler.js";

const PREVIEW_LIMIT = 5;

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

  emitPreviewState(count = 0) {
    this.dispatchEvent(
      new CustomEvent("friend-preview-state-change", {
        detail: {
          count,
          hasMoreThanPreview: count > PREVIEW_LIMIT,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  async update() {
    const response = await net.send(
      `/api/friends/${this.userId}?include=preview`,
      { method: "GET" },
      isLoggedIn(),
    );

    if (
      NetworkErrorHandler.handle(response, {
        strict: true,
        context: "FriendListPreview.update",
      })
    ) {
      this.reset();
      return;
    }

    const data = response.result.preview;

    if (!data) {
      this.reset();
      return;
    }

    this.data = data;
  }

  renderItem(item) {
    const el = document.createElement("template");
    const hasProfile = item?.has_profile !== 0;
    const avatarShellClass = hasProfile
      ? "friend-preview-avatar-shell"
      : "friend-preview-avatar-shell no-profile-avatar";
    const avatarClass = hasProfile
      ? "friend-preview-avatar"
      : "friend-preview-avatar no-profile-avatar";

    el.innerHTML = `
      <div class="friend-list-item">
        <span class="${avatarShellClass}"><img class="${avatarClass}" /></span>
        <span>${item.name}</span>
      </div>
    `;

    const img = el.content.querySelector("img");
    img.src = item.avatar || "/image/defaultPfp.png";

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

    this.emitPreviewState(this.data.length);

    if (this.data.length === 0) {
      const empty = document.createElement("p");
      empty.className = "friend-list-empty";
      empty.textContent = "Nincsenek megjeleníthető barátok.";
      this._container.appendChild(empty);
      return;
    }

    for (const item of this.data.slice(0, PREVIEW_LIMIT)) {
      this._container.appendChild(this.renderItem(item));
    }
  }

  reset() {
    if (!this._built) return;
    this._container.textContent = "";
    this.emitPreviewState(0);
  }
}

window.customElements.define("friend-list-preview", FriendListPreview);
