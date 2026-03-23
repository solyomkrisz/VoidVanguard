import "/ui/component/auth/LogoutButton.js";

export default class AccountQuickManager extends HTMLElement {
  constructor() {
    super();
    this._elements = {};
  }

  connectedCallback() {
    if (this._initialized) return;

    this.build();

    this._initialized = true;
  }

  build() {
    this.innerHTML = `
      <div>
        <a href="">Bejelentkezés</a>
        <a href="">Regisztráció</a>
      </div>
      <div>
        <span>Logged out</span>
        <a>Profile megtekintése</a>
        <logout-button></logout-button>
      </div>
    `;

    const elements = this._elements;

    elements.ifLoggedIn = this.querySelector("div:first-child");
    elements.notLoggedIn = this.querySelector("div:last-child");

    elements.username = this.querySelector("span");
    elements.profileLink = this.querySelector("a");
    elements.logoutButton = this.querySelector("logout-button");
  }
}

window.customElements.define("account-quick-manager", AccountQuickManager);
