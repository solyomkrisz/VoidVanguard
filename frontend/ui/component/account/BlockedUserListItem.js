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
    // this.hidden = false;
  }

  onLogout(e) {
    // this.hidden = true;
  }

  connectedCallback() {
    this.build();
    this.update();

    // if (!isLoggedIn()) {
    //   this.hidden = true;
    // } else {
    //   this.hidden = false;
    // }

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  build() {
    if (this._built) return;

    this._elements.avatar = el("img", { class: "blocked-user-avatar" });
    this._elements.avatarShell = el("span", { class: "blocked-user-avatar" }, [
      this._elements.avatar,
    ]);
    this._elements.name = el("div", { class: "blocked-user-name" });
    this._elements.meta = this.appendChild(
      el("div", { class: "blocked-user-meta" }, [
        this._elements.avatarShell,
        this._elements.name,
      ]),
    );
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

    const hasProfile = this.data?.has_profile !== 0;

    this._elements.name.textContent = this.data?.name;

    this.data?.avatar && (this._elements.avatar.src = this.data?.avatar);
    this._elements.avatar.classList.toggle(
      "no-profile-avatar",
      !this.data?.avatar,
    );
    this._elements.avatarShell.classList.toggle(
      "no-profile-avatar",
      !this.data?.avatar,
    );

    this._elements.avatar
      .closest(".friend-avatar-shell")
      ?.classList.toggle("no-profile-avatar", !hasProfile);
  }
}

window.customElements.define("blocked-user-list-item", BlockedUserListItem);
