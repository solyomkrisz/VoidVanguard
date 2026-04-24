import { on, off } from "/common/eventhub.js";
import { isLoggedIn } from "/common/common.js";
import { el } from "/ui/UI.js";

export default class BlockedUserListItem extends HTMLElement {
  set data(value) {
    this._data = value;
    this.update();
  }

  get data() {
    return this._data;
  }

  constructor() {
    super();

    this._data = null;
    this._elements = {};
    this._built = false;

    this.onUnblockButtonClick = this.onUnblockButtonClick.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  onUnblockButtonClick(e) {
    this.dispatchEvent(
      new CustomEvent("unblock-user", {
        detail: { userId: this.data.user_id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onLogin(e) {
    this.hidden = false;
  }

  onLogout(e) {
    this.hidden = true;
  }

  connectedCallback() {
    this.build();
    this.update();

    if (!isLoggedIn()) {
      this.hidden = true;
    } else {
      this.hidden = false;
    }

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  build() {
    if (this._built) return;

    this._elements.name = this.appendChild(el("div"));
    this._elements.unblockButton = this.appendChild(
      el(
        "button",
        {
          onClick: this.onUnblockButtonClick,
        },
        ["Tiltás feloldása"],
      ),
    );

    this._built = true;
  }

  update() {
    if (!this._built) return;
    this._elements.name.textContent = this.data?.name;
  }
}

window.customElements.define("blocked-user-list-item", BlockedUserListItem);
