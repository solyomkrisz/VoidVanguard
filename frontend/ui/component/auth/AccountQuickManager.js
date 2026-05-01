import { isLoggedIn } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import * as net from "/common/network.js";
import "/ui/component/auth/LogoutButton.js";
import NetworkErrorHandler from "/common/NetworkErrorHandler.js";

async function getIncomingFriendRequestCount(userId) {
  if (!userId) return null;

  const response = await net.send(
    `/api/friends/${userId}?include=incomingCount`,
  );

  if (NetworkErrorHandler.handle(response)) {
    return null;
  }

  if (response?.result?.incomingCount != null) {
    return response?.result.incomingCount;
  }

  return null;
}

export default class AccountQuickManager extends HTMLElement {
  constructor() {
    super();

    this._elements = {};
    this._built = false;

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  onLogin() {
    this.update();
  }

  onLogout() {
    this.update();
  }

  connectedCallback() {
    this.build();

    on("login", this.onLogin);
    on("logout", this.onLogout);

    this.update();
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  build() {
    if (this._built) return;

    this.innerHTML = `
      <div class="not-logged-in" hidden>
        <a href="/">További funkciók eléréséhez jelentkezz be itt!</a>
      </div>

      <div class="logged-in" hidden>
        <div class="quick-actions">
          <span class="profile-label">Profilom</span>
          <a class="profile-link quick-action-link">Profil megtekintése</a>
          <a href="/me" class="quick-action-link">Fiók kezelése</a>
          <a
            href="/me?active=incoming-friend-requests"
            class="quick-action-link incoming-friend-requests-link"
          >
            <span>Beérkező barátkérelmek</span>
            <span class="incoming-friend-requests-count"></span>
          </a>
          <logout-button></logout-button>
        </div>
      </div>
    `;

    const elements = this._elements;

    elements.ifLoggedIn = this.querySelector(".logged-in");
    elements.notLoggedIn = this.querySelector(".not-logged-in");

    elements.profileLabel = this.querySelector(".profile-label");
    elements.profileLink = this.querySelector(".profile-link");
    elements.logoutButton = this.querySelector("logout-button");
    elements.friendRequestCount = this.querySelector(
      ".incoming-friend-requests-count",
    );

    this._built = true;
  }

  toggleActive(loggedIn) {
    const elements = this._elements;

    if (loggedIn) {
      elements.ifLoggedIn.hidden = false;
      elements.notLoggedIn.hidden = true;
    } else {
      elements.ifLoggedIn.hidden = true;
      elements.notLoggedIn.hidden = false;
    }
  }

  async update() {
    if (!this._built) return;

    const elements = this._elements;
    const loggedIn = isLoggedIn();

    this.toggleActive(loggedIn);

    if (loggedIn && window?.VoidVanguard?.user) {
      const user = window.VoidVanguard.user;

      elements.profileLabel.textContent = `Profilom (${user.username})`;
      elements.profileLink.setAttribute("href", "/profile/" + user.id);

      const incomingCount = await getIncomingFriendRequestCount(user.id);
      if (incomingCount != null) {
        elements.friendRequestCount.textContent = `(${incomingCount})`;
      }
    } else {
      elements.profileLabel.textContent = "Profilom";
      elements.profileLink.removeAttribute("href");
      elements.friendRequestCount.textContent = "";
    }
  }
}

window.customElements.define("account-quick-manager", AccountQuickManager);
