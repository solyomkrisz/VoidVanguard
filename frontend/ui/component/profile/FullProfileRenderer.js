import * as net from "/common/network.js";
import "/ui/component/profile/FriendshipActionButton.js";
import "/ui/component/profile/BlockActionButton.js";
import "/ui/component/profile/CommentSectionRenderer.js";
import { isEqual } from "/common/common.js";

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
    this._built = false;

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
    this.update({ origin: "blockStatusChangeHandler" });
  }

  connectedCallback() {
    this.build();

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

  build() {
    if (this._built) return;

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
        <div class="profile-body"></div>
        <div class="profile-footer">
          <comment-section-renderer>
          </comment-section-renderer>
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
    elements.commentSectionRenderer = this.querySelector(
      "comment-section-renderer",
    );

    this._built = true;
  }

  async update(meta) {
    if (!this._built) {
      this.build();
    }

    const currentUserId = this.userId;

    const response = await net.send("/api/profiles/" + currentUserId);

    if (currentUserId !== this.userId) {
      return;
    }

    this._elements.friendshipActionButton.setAttribute("user-id", this.userId);

    if (meta?.origin !== "blockStatusChangeHandler") {
      this._elements.blockActionButton.setAttribute("user-id", this.userId);
    }

    if (!response.success) {
      console.error("Unable to fetch profile.");
      return;
    }

    this._previousProfileData = this._profileData;
    this._profileData = response.result;

    const { avatar, profileName, profileDescription } = this._elements;
    const currProfileData = this._profileData;

    if (
      !isEqual(this._profileData, this._previousProfileData, "block_status")
    ) {
      this.updateFriendshipActionButtonVisibility();
    }

    if (!isEqual(this._profileData, this._previousProfileData, "avatar")) {
      avatar.src = currProfileData.avatar;
    }

    if (
      !isEqual(this._profileData, this._previousProfileData, "display_name")
    ) {
      profileName.textContent = currProfileData.display_name;
    }

    if (!isEqual(this._profileData, this._previousProfileData, "description")) {
      profileDescription.textContent = currProfileData.description;
    }
  }

  updateFriendshipActionButtonVisibility() {
    const button = this._elements.friendshipActionButton;

    const wasBlocked =
      this._previousProfileData?.block_status === "you-blocked" ||
      this._previousProfileData?.block_status === "got-blocked";

    const isBlocked =
      this._profileData?.block_status === "you-blocked" ||
      this._profileData?.block_status === "got-blocked";

    if (!isBlocked) {
      if (wasBlocked) {
        button?.refresh();
      }

      button.hidden = false;
    } else {
      button.hidden = true;
    }
  }
}

window.customElements.define("full-profile-renderer", FullProfileRenderer);
