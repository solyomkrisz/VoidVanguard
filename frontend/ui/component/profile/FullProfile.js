import * as net from "/common/network.js";
import { isEqual, isLoggedIn } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import "/ui/component/profile/FriendshipActionButton.js";
import "/ui/component/profile/BlockActionButton.js";
import "/ui/component/profile/CommentSection.js";
import "/ui/component/profile/CommentForm.js";
import "/ui/component/layout/FullscreenOverlay.js";
import "/ui/component/profile/ProfileForm.js";

export default class FullProfile extends HTMLElement {
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
    this.onProfileCreate = this.onProfileCreate.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "user-id" && oldValue !== newValue) {
      setTimeout(() => this.update());
    }
  }

  onLogin(e) {}

  onLogout(e) {}

  onFriendshipStatusChange(e) {
    this.update({ origin: "friendshipStatusChangeHandler" });
  }

  onBlockStatusChange(e) {
    this.update({ origin: "blockStatusChangeHandler" });
  }

  onProfileCreate(e) {
    const profileData = e.detail?.result;

    if (!profileData) return;
  }

  connectedCallback() {
    this.build();

    on("login", this.onLogin);
    on("logout", this.onLogout);
    this.addEventListener(
      "friendship-status-change",
      this.onFriendshipStatusChange,
    );
    this.addEventListener("block-status-change", this.onBlockStatusChange);
    this.addEventListener("profile-create", this.onProfileCreate);
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  onError(error) {
    const elements = this._elements;
    if (!elements) return;

    elements.profileContainer.hidden = true;
    elements.errorMessage.hidden = false;

    if (
      isLoggedIn() &&
      error.code === "ER_PROFILE_NOT_FOUND" &&
      this.userId === window.VoidVanguard.user.id
    ) {
      elements.fullscreenOverlay.hidden = false;
    }
  }

  build() {
    if (this._built) return;

    this.innerHTML = `
      <div class="error" hidden>
        <h1>Hiba történt a profil betöltése közben</h1>
      </div>

      <div class="profile-container">
        <div class="profile-header">
            <img class="avatar" />
            <div>
                <div class="profile-name"></div>
                <div class="profile-description"></div>
            </div>
            <div class="profile-header-actions">
                <friendship-action-button controlled></friendship-action-button>
                <block-action-button controlled></block-action-button>
            </div>
        </div>
        <div class="profile-body"></div>
        <div class="profile-footer">
          <comment-section controls="scroll" page-size="1">
            <comment-form></comment-form>
          </comment-section>
        </div>
      </div>

      <div>
        <fullscreen-overlay no-close hidden>
          <profile-form></profile-form>
        </fullscreen-overlay>
      </div>
    `;

    const elements = this._elements;

    elements.profileContainer = this.querySelector(".profile-container");
    elements.errorMessage = this.querySelector(".error");
    elements.avatar = this.querySelector(".avatar");
    elements.profileName = this.querySelector(".profile-name");
    elements.profileDescription = this.querySelector(".profile-description");
    elements.friendshipActionButton = this.querySelector(
      "friendship-action-button",
    );
    elements.blockActionButton = this.querySelector("block-action-button");
    elements.commentSection = this.querySelector("comment-section");
    elements.commentForm = this.querySelector("comment-form");
    elements.fullscreenOverlay = this.querySelector("fullscreen-overlay");

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

    const elements = this._elements;

    elements.commentForm.setAttribute("target-id", this.userId);
    elements.commentSection.setAttribute(
      "src",
      `/api/comments?targetId=${this.userId}`,
    );

    if (meta?.origin !== "friendshipStatusChangeHandler") {
      elements.friendshipActionButton.setAttribute("user-id", this.userId);
    }

    if (meta?.origin !== "blockStatusChangeHandler") {
      elements.blockActionButton.setAttribute("user-id", this.userId);
    }

    if (!response.success) {
      console.error("Unable to fetch profile.");
      this.onError(response.result);

      return;
    }

    this._previousProfileData = this._profileData;
    this._profileData = response.result;

    elements.profileContainer.hidden = false;
    elements.errorMessage.hidden = true;

    const { avatar, profileName, profileDescription } = this._elements;
    const currProfileData = this._profileData;

    // update action buttons
    // prettier-ignore
    if (!isEqual(this._profileData, this._previousProfileData, "friendship_status")) {
      elements.friendshipActionButton.status = currProfileData.friendship_status;
    }

    if (
      !isEqual(this._profileData, this._previousProfileData, "block_status")
    ) {
      elements.blockActionButton.status = currProfileData.block_status;
      this.updateCommentSection();
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

  updateCommentSection() {
    const commentSection = this._elements.commentSection;
    const blockStatus = this._profileData.block_status;

    if (blockStatus === "you-blocked" || blockStatus === "got-blocked") {
      commentSection.removeAttribute("can-comment");
    } else {
      commentSection.setAttribute("can-comment", "");
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

window.customElements.define("full-profile", FullProfile);
