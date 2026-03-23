import * as net from "/common/network.js";
import "./FriendshipActionButton.js";
import "./BlockActionButton.js";

export default class FullProfileRenderer extends HTMLElement {
  static get observedAttributes() {
    return ["user-id"];
  }

  get userId() {
    return this.getAttribute("user-id");
  }

  set userId(value) {
    this.setAttribute("user-id", value);
  }

  constructor() {
    super();

    this._elements = {};
    this._profileData = {};
    this._previousProfileData = {};
    this._rendered = false;

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onFriendshipStatusChange = this.onFriendshipStatusChange.bind(this);
    this.onBlockStatusChange = this.onBlockStatusChange.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "user-id" && oldValue !== newValue) {
      this.update();
    }
  }

  onLogin(e) {}

  onLogout(e) {}

  onFriendshipStatusChange(e) {
    console.log(e.detail);
  }

  onBlockStatusChange(e) {
    console.log(e.detail);
  }

  connectedCallback() {
    this.render();

    document.addEventListener("login", this.onLogin);
    document.addEventListener("logout", this.onLogout);
    this.addEventListener(
      "friendship-status-change",
      this.onFriendshipStatusChange,
    );
    this.addEventListener("block-status-change", this.onBlockStatusChange);
  }

  disconnectedCallback() {
    document.removeEventListener("login", this.onLogin);
    document.removeEventListener("logout", this.onLogout);
  }

  render() {
    if (this._rendered) return;

    this.innerHTML = `
        <div class="profile-header">
            <img class="avatar" />
            <div>
                <div class="profile-name"></div>
                <div class="profile-description"></div>
            </div>
            <div class="profile-header-actions">
                <friendship-action-button></friendship-action-button>
                <block-action-button></block-action-button>
            </div>
        </div>
    `;

    const elements = this._elements;

    elements.avatar = this.querySelector(".avatar");
    elements.profileName = this.querySelector(".profile-name");
    elements.profileDescription = this.querySelector(".profile-description");
    elements.friendshipActionButton = this.querySelector(
      "friendship-action-button",
    );
    elements.blockActionButton = this.querySelector("block-action-button");

    this._rendered = true;
  }

  async update() {
    if (!this._rendered) {
      this.render();
    }

    const currentUserId = this.userId;

    const response = await net.send("/api/profiles/" + currentUserId);

    if (currentUserId !== this.userId) {
      return;
    }

    this._elements.friendshipActionButton.setAttribute("user-id", this.userId);
    this._elements.blockActionButton.setAttribute("user-id", this.userId);

    if (!response.success) {
      console.error("Unable to fetch profile.");
      return;
    }

    this._previousProfileData = this._profileData;
    this._profileData = response.result;

    const { avatar, profileName, profileDescription } = this._elements;
    const currProfileData = this._profileData;

    avatar.src = currProfileData.avatar;
    profileName.textContent = currProfileData.display_name;
    profileDescription.textContent = currProfileData.description;
  }
}

window.customElements.define("full-profile-renderer", FullProfileRenderer);
