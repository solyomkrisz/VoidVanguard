/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/profile/FriendListItem.js
 * Szerep: Egyetlen ismeros sor megjelenitese akciogombokkal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { on, off } from "/common/eventhub.js";

const CONTROLS_DEFS = {
  accept: { text: "Elfogadás", handler: "onAccept" },
  delete: { text: "Eltávolítás", handler: "onDelete" },
  cancel: { text: "Visszavonás", handler: "onDelete" },
  deny: { text: "Elutasítás", handler: "onDelete" },
  block: { text: "Letiltás", handler: "onBlock" },
};

function getFriendUserId(friend) {
  return friend?.user_id || null;
}

export default class FriendListItem extends HTMLElement {
  static get observedAttributes() {
    return ["controls"];
  }

  set friend(value) {
    this._friend = value;
    this.update();
  }

  get friend() {
    return this._friend;
  }

  get controlsConfig() {
    const value = this.getAttribute("controls");
    if (!value) return [];

    return value.trim().split(/\s+/); // ["accept", "delete", "block"]
  }

  constructor() {
    super();

    this._personalized = false;
    this._friend = null;
    this._elements = {};
    this._built = false;

    this.onAccept = this.onAccept.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onBlock = this.onBlock.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "controls" && oldValue !== newValue) {
      this.updateControls();
    }
  }

  onAccept(e) {
    const userId = getFriendUserId(this.friend);
    if (!userId) {
      console.error(
        "Unable to resolve target user id for friend-accept action.",
      );
      return;
    }

    this.dispatchEvent(
      new CustomEvent("friend-accept", {
        detail: { userId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onDelete(e) {
    const userId = getFriendUserId(this.friend);
    if (!userId) {
      console.error(
        "Unable to resolve target user id for friend-delete action.",
      );
      return;
    }

    this.dispatchEvent(
      new CustomEvent("friend-delete", {
        detail: { userId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onBlock(e) {
    const userId = getFriendUserId(this.friend);
    if (!userId) {
      console.error("Unable to resolve target user id for user-block action.");
      return;
    }

    this.dispatchEvent(
      new CustomEvent("user-block", {
        detail: { userId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onLogin(e) {}

  onLogout(e) {}

  connectedCallback() {
    this.build();

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  build() {
    if (this._built) return;

    const elements = this._elements;

    this.innerHTML = `
        <a>
        <span class="friend-avatar-shell"><img /></span>
            <span class="friend-name"></span>
        </a>
    `;

    elements.link = this.querySelector("a");
    elements.img = this.querySelector("img");
    elements.name = this.querySelector(".friend-name");

    elements.controls = this.createControls();

    this._built = true;

    this.update();
  }

  createControls() {
    const wrapper = document.createElement("div");

    for (const item of this.controlsConfig) {
      const def = CONTROLS_DEFS[item];
      if (!def) continue;

      const handler = this[def.handler];
      if (typeof handler !== "function") continue;

      const button = document.createElement("button");
      button.dataset.sfx = "click_1";
      button.textContent = def.text;
      button.addEventListener("click", handler);

      wrapper.appendChild(button);
    }

    return wrapper;
  }

  updateControls() {
    if (!this._built) return;

    this.hideControls();

    this._elements.controls = this.createControls();

    if (this._personalized) {
      this.appendChild(this._elements.controls);
    }
  }

  hideControls() {
    const elements = this._elements;
    if (!elements) return;

    const controls = elements.controls;
    if (!controls) return;

    controls.remove();
  }

  update() {
    const elements = this._elements;
    if (!elements) return;

    const userId = getFriendUserId(this.friend);

    const hasProfile = this.friend?.has_profile !== 0;

    elements.link && (elements.link.href = userId ? "/profile/" + userId : "#");
    elements.name && (elements.name.textContent = this.friend?.name);
    if (elements.img) {
      elements.img.src = this.friend?.avatar || "/image/defaultPfp.png";
      elements.img.classList.toggle("no-profile-avatar", !hasProfile);
      elements.img
        .closest(".friend-avatar-shell")
        ?.classList.toggle("no-profile-avatar", !hasProfile);
    }
  }

  changePersonalization(shouldPersonalize) {
    if (!this._built) {
      this.build();
    }

    if (this._personalized === shouldPersonalize) return;

    const elements = this._elements;

    if (elements?.controls) {
      if (shouldPersonalize) {
        this.appendChild(elements.controls);
      } else {
        this.hideControls();
      }
    }

    this._personalized = shouldPersonalize;
  }
}

window.customElements.define("friend-list-item", FriendListItem);
