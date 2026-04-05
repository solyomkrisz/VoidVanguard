import { on, off } from "/common/eventhub.js";

export default class FriendListItem extends HTMLElement {
  set friend(value) {
    this._friend = value;
    this.update();
  }

  get friend() {
    return this._friend;
  }

  get personalize() {
    return this.hasAttribute("personalize");
  }

  constructor() {
    super();

    this._personalized = false;
    this._friend = null;
    this._elements = {};
    this._built = false;

    this.onDelete = this.onDelete.bind(this);
    this.onBlock = this.onBlock.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  onDelete(e) {
    this.dispatchEvent(
      new CustomEvent("friend-delete", {
        detail: { userId: this.friend?.user_id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onBlock(e) {
    this.dispatchEvent(
      new CustomEvent("user-block", {
        detail: { userId: this.friend?.user_id },
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
            <img />
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
    if (this._elements?.controls) {
      return this._elements.controls;
    }

    const wrapper = document.createElement("div");

    wrapper.innerHTML = `
        <button>Barát eltávolítása</button>
        <button>Felhasználó letiltása</button>
    `;

    const buttons = wrapper.querySelectorAll("button");
    const deleteFriendBtn = buttons[0];
    const blockUserBtn = buttons[1];

    deleteFriendBtn.addEventListener("click", this.onDelete);
    blockUserBtn.addEventListener("click", this.onBlock);

    return wrapper;
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

    elements.link && (elements.link.href = "/profile/" + this.friend?.name);
    elements.name && (elements.name.textContent = this.friend?.name);
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
