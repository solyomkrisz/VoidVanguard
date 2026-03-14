import _ from "/ui/component/auth/LogoutButton.js";
import _1 from "/ui/component/core/StateProviderElement.js";
import userState from "../../../state/user.js";

export default class AccountQuickManager extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (this._initialized) return;

    this.build();

    this._initialized = true;
  }

  build() {
    this.innerHTML = `
      <div>
        <span>Logged out</span>
        <a>Profile megtekintése</a>
        <state-provider>
          <span>Beérkező barátkérelmek: <span subscribe-to="incomingCount"></span></span>
        </state-provider>
        <logout-button></logout-button>
      </div>
    `;

    const username = this.querySelector("span");
    const profileLink = this.querySelector("a");
    const stateProvider = this.querySelector("state-provider");
    const logoutButton = this.querySelector("logout-button");

    // prettier-ignore
    {
      userState.sub("username", (_, value) => {
        username.textContent = value || "Logged out";

        if (value) logoutButton.hidden = false;
        else logoutButton.hidden = true;
      });

      userState.sub("id", (_, value) => {
        if (value) {
          profileLink.hidden = false;
          stateProvider.hidden = false;

          profileLink.setAttribute("href", "/profile/" + value);
          stateProvider.src = "/api/friends?include=incomingCount";

          return;
        }

        profileLink.hidden = true;
        stateProvider.hidden = true;
      });
    }
  }
}

window.customElements.define("account-quick-manager", AccountQuickManager);
