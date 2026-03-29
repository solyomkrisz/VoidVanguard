import * as net from "/common/network.js";
import { isEqual, isLoggedIn } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import "/ui/component/profile/FriendshipActionButton.js";
import "/ui/component/profile/BlockActionButton.js";
import "/ui/component/profile/CommentSection.js";
import "/ui/component/profile/CommentForm.js";
import "/ui/component/profile/FriendListPreview.js";
import "/ui/component/profile/FriendListFull.js";
import "/ui/component/layout/FullscreenOverlay.js";
import "/ui/component/profile/ProfileForm.js";
import "/ui/component/decorative/DashedBorderBox.js";
import "/ui/component/form/InlineEditor.js";

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

    this._relationshipControlsShown = null;
    this._withEditors = null;

    this._changed = new Set();
    this._editing = false;

    this._built = false;

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onFriendshipStatusChange = this.onFriendshipStatusChange.bind(this);
    this.onBlockStatusChange = this.onBlockStatusChange.bind(this);
    this.onProfileCreate = this.onProfileCreate.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onInlineEdit = this.onInlineEdit.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "user-id" && oldValue !== newValue) {
      requestAnimationFrame(() => this.update());
    }
  }

  onLogin(e) {
    this.updateContent();
  }

  onLogout(e) {
    this.updateContent();
  }

  async onFriendshipStatusChange(e) {
    await this.update({ origin: "friendshipStatusChangeHandler" });
    e.target?.enable();
  }

  async onBlockStatusChange(e) {
    await this.update({ origin: "blockStatusChangeHandler" });
    e.target?.enable();
  }

  onProfileCreate(e) {
    const profileData = e.detail?.result;
    if (!profileData) return;

    this.updateContent(profileData);
    this._elements.profileFormOverlay?.remove();
  }

  async onSave(e) {
    const form = this.querySelector("form");
    if (!form) return;

    const formData = new FormData(form);

    const response = await net.send("/api/profiles", {
      method: "PATCH",
      body: formData,
    });

    const { success, result, message } = response;

    if (!success) {
      console.error("Error during profile update: " + message);
      return;
    }

    this._changed.clear();
    this.toggleEditing();

    this.update({ origin: "profileUpdateHandler" });
  }

  onInlineEdit(e) {
    e.stopPropagation();

    const newValue = e.detail?.newValue;
    const propName = e.detail?.name;

    if (!Object.is(this._profileData[propName], newValue)) {
      this._changed.add(propName);
    } else {
      this._changed.delete(propName);
    }

    this.toggleEditing();
  }

  toggleEditing() {
    const button = this._elements.saveButton;
    if (!button) return;

    if (this._changed.size > 0 && !this._editing) {
      button.hidden = false;
      this._editing = true;
    } else if (this._changed.size === 0 && this._editing) {
      button.hidden = true;
      this._editing = false;
    }
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
    this.addEventListener("inline-edit", this.onInlineEdit);
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);

    this.removeEventListener(
      "friendship-status-change",
      this.onFriendshipStatusChange,
    );
    this.removeEventListener("block-status-change", this.onBlockStatusChange);
    this.removeEventListener("profile-create", this.onProfileCreate);
    this.removeEventListener("inline-edit", this.onInlineEdit);
  }

  onError(error) {
    const elements = this._elements;
    if (!elements) return;

    elements.profileContainer.hidden = true;
    elements.errorMessage.hidden = false;

    if (
      isLoggedIn() &&
      error?.code === "ER_PROFILE_NOT_FOUND" &&
      this.userId === window.VoidVanguard.user.id
    ) {
      elements.profileFormOverlay.hidden = false;
    }
  }

  updateProfileHeaderDetailsInner() {
    const elements = this._elements;

    const container = elements.profileHeaderDetails;
    if (!container) return;

    const addEditors =
      isLoggedIn() &&
      this._profileData.user_id != null &&
      this._profileData.user_id === window.VoidVanguard.user.id;

    if (this._withEditors === addEditors) return;

    if (addEditors) {
      container.innerHTML = `
        <form>
          <inline-editor>
            <dashed-border-box>
              <div data-text class="profile-name">${this._profileData.display_name ?? ""}</div>
            </dashed-border-box>
            <input data-editor type="text" name="display_name" />
          </inline-editor>

          <inline-editor>
            <dashed-border-box>
              <div data-text class="profile-description">${this._profileData.description ?? ""}</div>
            </dashed-border-box>
            <textarea data-editor name="description"></textarea>
          </inline-editor>
        </form>
      `;
    } else {
      container.innerHTML = `
        <div class="profile-name">${this._profileData.display_name ?? ""}</div>
        <div class="profile-description">${this._profileData.description ?? ""}</div>
      `;
    }

    elements.profileName = this.querySelector(".profile-name");
    elements.profileDescription = this.querySelector(".profile-description");

    this._withEditors = addEditors;
  }

  // prettier-ignore
  updateProfileHeaderActions() {
    const elements = this._elements;

    const container = elements.profileHeaderActions;
    if (!container) return;

    const showRelationshipControls =
      isLoggedIn() &&
      this._profileData.user_id != null &&
      this._profileData.user_id !== window.VoidVanguard.user.id;

    if (this._relationshipControlsShown === showRelationshipControls) return;

    if (showRelationshipControls) {
      container.innerHTML = `
        <friendship-action-button controlled></friendship-action-button>
        <block-action-button controlled></block-action-button>
      `;
    } else {
      container.innerHTML = `<button id="save" hidden>Mentés</button>`;
    }

    elements.friendshipActionButton = this.querySelector("friendship-action-button");
    elements.blockActionButton = this.querySelector("block-action-button");

    const button = this.querySelector("#save");
    if (button) {
      button.addEventListener("click", this.onSave);
      elements.saveButton = button;
    }

    this._relationshipControlsShown = showRelationshipControls;
  }

  build() {
    if (this._built) return;

    this.innerHTML = `
      <div class="error" hidden>
        <h1>Hiba történt a profil betöltése közben</h1>
      </div>

      <div class="profile-container">
        <div class="profile-header">
            <img draggable="false" class="avatar skeleton" />

            <div class="profile-header-details"></div>
            <div class="profile-header-actions">
            </div>
        </div>
        <div class="profile-body">
          <div>
            <div id="friend-list-full-toggle">Összes barát megtekintése</div>
            <friend-list-preview></friend-list-preview>
          </div>
        </div>
        <div class="profile-footer">
          <comment-section controls="pagination" page-size="2">
            <comment-form></comment-form>
          </comment-section>
        </div>
      </div>

      <div>
        <fullscreen-overlay id="profile-form" no-close hidden>
          <profile-form></profile-form>
        </fullscreen-overlay>
        <fullscreen-overlay id="friend-list-full" hidden>
          <friend-list-full controls="pagination" page-size="6"></friend-list-full>
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
    this.updateProfileHeaderDetailsInner();

    elements.profileHeaderActions = this.querySelector(
      ".profile-header-actions",
    );
    this.updateProfileHeaderActions();

    elements.friendList = this.querySelector("friend-list-preview");
    elements.commentSection = this.querySelector("comment-section");
    elements.commentForm = this.querySelector("comment-form");
    elements.profileFormOverlay = this.querySelector("#profile-form");
    elements.friendListOverlay = this.querySelector("#friend-list-full");
    elements.friendListFull = this.querySelector("friend-list-full");
    elements.friendListFullToggle = this.querySelector(
      "#friend-list-full-toggle",
    );

    elements.friendListFullToggle.addEventListener("click", function () {
      elements.friendListOverlay.hidden = false;
    });

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

    if (!response.success) {
      console.error("Unable to fetch profile.");
      this.onError(response.result);

      return;
    }

    this.updateContent(response.result);
  }

  updateContent(data = null) {
    if (!this._built) this.build();

    if (data) {
      this._previousProfileData = this._profileData;
      this._profileData = data;
    }

    const currData = this._profileData;

    this.updateProfileHeaderDetailsInner();
    this.updateProfileHeaderActions();

    const elements = this._elements;
    const {
      avatar,
      profileName,
      profileDescription,
      blockActionButton,
      friendshipActionButton,
    } = this._elements;

    if (friendshipActionButton) {
      elements.friendshipActionButton.status = currData.friendship_status;
    }

    if (blockActionButton) {
      elements.blockActionButton.status = currData.block_status;

      this.updateCommentSection();
      this.updateFriendshipActionButtonVisibility();
    }

    if (!isEqual(currData, this._previousProfileData, "user_id")) {
      if (blockActionButton) {
        elements.blockActionButton.setAttribute("user-id", this.userId);
      }

      if (friendshipActionButton) {
        elements.friendshipActionButton.setAttribute("user-id", this.userId);
      }

      if (elements.friendListFull) {
        elements.friendListFull.setAttribute(
          "src",
          `/api/friends?targetId=` + this.userId,
        );
      }

      elements.commentForm.setAttribute("target-id", this.userId);
      elements.commentSection.setAttribute(
        "src",
        `/api/comments?targetId=${this.userId}`,
      );
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

    // friendlist
    if (currData.friend_list_preview) {
      elements.friendList.data = currData.friend_list_preview;
    }

    elements.profileContainer.hidden = false;
    elements.errorMessage.hidden = true;
  }

  updateCommentSection() {
    const commentSection = this._elements.commentSection;
    if (!commentSection) return;

    const blockStatus = this._profileData.block_status;

    if (blockStatus === "you-blocked" || blockStatus === "got-blocked") {
      commentSection.removeAttribute("can-comment");
    } else {
      commentSection.setAttribute("can-comment", "");
    }
  }

  updateFriendshipActionButtonVisibility() {
    const button = this._elements.friendshipActionButton;
    if (!button) return;

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
