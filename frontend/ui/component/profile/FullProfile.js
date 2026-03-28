import * as net from "/common/network.js";
import { isEqual, isLoggedIn } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import "/ui/component/profile/FriendshipActionButton.js";
import "/ui/component/profile/BlockActionButton.js";
import "/ui/component/profile/CommentSection.js";
import "/ui/component/profile/CommentForm.js";
import "/ui/component/layout/FullscreenOverlay.js";
import "/ui/component/profile/ProfileForm.js";
import "/ui/component/decorative/DashedBorderBox.js";
import "/ui/component/form/InlineEditor.js";
import "/ui/component/skeleton/SkeletonText.js";

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

  onLogin(e) {
    this.updateContent();
  }

  onLogout(e) {
    this.updateContent();
  }

  onFriendshipStatusChange(e) {
    this.update({ origin: "friendshipStatusChangeHandler" });
  }

  onBlockStatusChange(e) {
    this.update({ origin: "blockStatusChangeHandler" });
  }

  onProfileCreate(e) {
    const profileData = e.detail?.result;
    if (!profileData) return;

    this.updateContent(profileData);
    this._elements.fullscreenOverlay?.remove();
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

  updateProfileHeaderDetailsInner() {
    const elements = this._elements;

    const container = elements.profileHeaderDetails;
    if (!container) return;

    if (
      isLoggedIn() &&
      this._profileData.user_id === window.VoidVanguard.user.id
    ) {
      container.innerHTML = `
        <skeleton-text lines="1"></skeleton-text>
        <inline-editor>
          <dashed-border-box>
            <div data-text class="profile-name has-skeleton"></div>
          </dashed-border-box>
          <input data-editor type="text" name="display_name" />
        </inline-editor>

        <skeleton-text lines="2"></skeleton-text>
        <inline-editor>
          <dashed-border-box>
            <div data-text class="profile-description has-skeleton"></div>
          </dashed-border-box>
          <textarea data-editor name="description"></textarea>
        </inline-editor>
      `;
    } else {
      container.innerHTML = `
        <skeleton-text lines="1"></skeleton-text>
        <div class="profile-name has-skeleton"></div>
        <skeleton-text lines="2"></skeleton-text>
        <div class="profile-description has-skeleton"></div>
      `;
    }

    elements.profileName = this.querySelector(".profile-name");
    elements.profileDescription = this.querySelector(".profile-description");
  }

  build() {
    if (this._built) return;

    this.innerHTML = `
      <div class="error" hidden>
        <h1>Hiba történt a profil betöltése közben</h1>
      </div>

      <div class="profile-container skeleton--loading">
        <div class="profile-header">
            <img class="avatar" />
            <div class="profile-header-details">
                <skeleton-text lines="1"></skeleton-text>
                <div class="profile-name has-skeleton"></div>
                <skeleton-text lines="2"></skeleton-text>
                <div class="profile-description has-skeleton"></div>
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
    elements.profileHeaderDetails = this.querySelector(
      ".profile-header-details",
    );
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

    const elements = this._elements;

    const currentUserId = this.userId;

    const response = await net.send("/api/profiles/" + currentUserId);

    if (currentUserId !== this.userId) {
      return;
    }

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

    this.updateContent(response.result);
  }

  updateContent(data = null) {
    if (data) {
      this._previousProfileData = this._profileData;
      this._profileData = data;
    }

    const currData = this._profileData;

    this.updateProfileHeaderDetailsInner();

    const elements = this._elements;
    const { avatar, profileName, profileDescription } = this._elements;

    if (!isEqual(currData, this._previousProfileData, "friendship_status")) {
      elements.friendshipActionButton.status = currData.friendship_status;
    }

    if (!isEqual(currData, this._previousProfileData, "block_status")) {
      elements.blockActionButton.status = currData.block_status;
      this.updateCommentSection();
      this.updateFriendshipActionButtonVisibility();
    }

    if (!isEqual(currData, this._previousProfileData, "avatar")) {
      avatar.src = currData.avatar;
    }

    if (!isEqual(currData, this._previousProfileData, "display_name")) {
      profileName.textContent = currData.display_name;
    }

    if (!isEqual(currData, this._previousProfileData, "description")) {
      profileDescription.textContent = currData.description;
    }

    elements.profileContainer.hidden = false;
    elements.errorMessage.hidden = true;

    elements.profileContainer.classList.remove("skeleton--loading");
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
