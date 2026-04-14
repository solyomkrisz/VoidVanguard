import * as net from "/common/network.js";
import { isEqual, isLoggedIn, isAdmin } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import { el } from "/ui/UI.js";
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

import "/ui/component/validator/DisplayNameInputValidator.js";
import "/ui/component/validator/DescriptionInputValidator.js";

// name - selector
const TO_SELECT = new Map([
  ["profileContainer", ".profile-container"],
  ["errorMessage", ".error"],
  ["avatar", ".avatar"],
  ["profileHeaderDetails", ".profile-header-details"],
  ["profileHeaderActions", ".profile-header-actions"],
  ["friendList", "friend-list-preview"],
  ["commentSection", "comment-section"],
  ["commentForm", "comment-form"],
  ["profileFormOverlay", "#profile-form"],
  ["friendListOverlay", "#friend-list-full"],
  ["friendListFull", "friend-list-full"],
  ["friendListFullToggle", "#friend-list-full-toggle"],
]);

function selectElements(from, save) {
  for (const [name, selector] of TO_SELECT) {
    save[name] = from.querySelector(selector);
  }

  return save;
}

const EVENTHANDLERS = new Map([
  ["friend-list-change", "onFriendListChange"],
  ["friendship-status-change", "onFriendshipStatusChange"],
  ["block-status-change", "onBlockStatusChange"],
  ["profile-create", "onProfileCreate"],
  ["inline-edit", "onInlineEdit"],
]);

function toggleEventListeners(instance, initializerName) {
  for (const [name, handlerName] of EVENTHANDLERS) {
    const handlerFn = instance[handlerName];
    if (typeof handlerFn !== "function") continue;

    const initializerFn = instance[initializerName];
    if (typeof initializerFn !== "function") continue;

    instance[initializerName](name, handlerFn);
  }
}

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

  get shouldShowEditors() {
    return (
      isLoggedIn() &&
      this._profileData?.user_id != null &&
      (this._profileData.user_id === window.VoidVanguard?.user?.id ||
        (this.admin && isAdmin()))
    );
  }

  get admin() {
    return this.hasAttribute("admin");
  }

  constructor() {
    super();

    this._elements = {};
    this._profileData = {};
    this._previousProfileData = {};

    this._relationshipControlsShown = null;

    this._headerCache = {
      editable: null,
      readonly: null,
      active: null,
    };
    this._actionsCache = {
      controls: null,
      save: null,
      active: null,
    };

    this._changed = new Set();
    this._editing = false;

    this._built = false;

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onFriendListChange = this.onFriendListChange.bind(this);
    this.onFriendshipStatusChange = this.onFriendshipStatusChange.bind(this);
    this.onBlockStatusChange = this.onBlockStatusChange.bind(this);
    this.onProfileCreate = this.onProfileCreate.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onInlineEdit = this.onInlineEdit.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "user-id" && oldValue !== newValue) {
      requestAnimationFrame(() =>
        this.update({ origin: "attributeChangedCallback" }),
      );
    }
  }

  onLogin(e) {
    this.update({ origin: "onLogin" });
  }

  onLogout(e) {
    this.update({ origin: "onLogout" });
  }

  onFriendListChange(e) {
    if (this.userId === e?.detail?.userId) {
      const { friendList } = this._elements;
      if (!friendList) return;

      friendList.refresh?.();
    }
  }

  async onFriendshipStatusChange(e) {
    console.log(e.target);
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

    this.updateContent({ origin: "onProfileCreate" }, profileData);
    this._elements.profileFormOverlay?.remove();
  }

  async onDelete(e) {
    const formData = new FormData();

    /** admin */
    if (this.admin && isAdmin()) {
      formData.append("targetUserId", this.userId);
    }

    const response = await net.send("/api/profiles", {
      method: "DELETE",
      body: formData,
    });

    const { success, message } = response;

    if (!success) {
      console.error("Error during profile deletion: " + message);
      return;
    }

    this.update({ origin: "profileDeletionHandler" });
  }

  async onSave(e) {
    const form = this.querySelector("form");
    if (!form) return;

    const formData = new FormData(form);

    /** admin */
    if (this.admin && isAdmin()) {
      formData.append("targetUserId", this.userId);
    }

    const response = await net.send("/api/profiles", {
      method: "PATCH",
      body: formData,
    });

    const { success, message } = response;

    if (!success) {
      console.error("Error during profile update: " + message);
      return;
    }

    this._changed.clear();
    this.toggleEditing();

    this.update({ origin: "profileUpdateHandler" });
  }

  onCancel(e) {
    this._changed.clear();
    this.toggleEditing();
    this.renderCoreFields(this._profileData, null);
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
    const saveButton = this._elements.saveButton;
    const cancelButton = this._elements.cancelButton;
    if (!saveButton || !cancelButton) return;

    if (this._changed.size > 0 && !this._editing) {
      saveButton.hidden = false;
      cancelButton.hidden = false;
      this._editing = true;
    } else if (this._changed.size === 0 && this._editing) {
      saveButton.hidden = true;
      cancelButton.hidden = true;
      this._editing = false;
    }
  }

  connectedCallback() {
    this.build();

    on("login", this.onLogin);
    on("logout", this.onLogout);

    toggleEventListeners(this, "addEventListener");
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);

    toggleEventListeners(this, "removeEventListener");
  }

  onError(error) {
    const elements = this._elements;
    if (!elements) return;

    elements.profileContainer.hidden = true;
    elements.errorMessage.hidden = false;

    if (
      isLoggedIn() &&
      error?.code === "ER_PROFILE_NOT_FOUND" &&
      (this.userId === window.VoidVanguard.user.id || (this.admin && isAdmin()))
    ) {
      elements.profileFormOverlay.hidden = false;
    }
  }

  buildHeaderDetailsDOM(data, editable) {
    if (!editable) {
      return el("div", {}, [
        el("div", { class: "profile-name" }, [data.display_name ?? ""]),
        el("div", { class: "profile-description" }, [data.description ?? ""]),
      ]);
    }

    return el("form", {}, [
      el("inline-editor", {}, [
        el("dashed-border-box", {}, [
          el(
            "div",
            {
              class: "profile-name",
              "data-text": "",
            },
            [data.display_name ?? ""],
          ),
        ]),
        el("display-name-input-validator", { "disable-on-invalid": "#save" }, [
          el("input", {
            "data-editor": "",
            type: "text",
            name: "display_name",
          }),
        ]),
      ]),

      el("inline-editor", {}, [
        el("dashed-border-box", {}, [
          el(
            "div",
            {
              class: "profile-description",
              "data-text": "",
            },
            [data.description ?? ""],
          ),
        ]),
        el("description-input-validator", { "disable-on-invalid": "#save" }, [
          el("textarea", {
            "data-editor": "",
            name: "description",
          }),
        ]),
      ]),
    ]);
  }

  buildProfileHeaderActionsDOM(showRelationshipControls, canEdit) {
    if (showRelationshipControls) {
      return el("div", {}, [
        el("friendship-action-button", { controlled: "" }),
        el("block-action-button", { controlled: "" }),
      ]);
    }

    if (canEdit) {
      return el("div", {}, [
        el(
          "button",
          {
            id: "save",
            hidden: true,
            onClick: this.onSave,
          },
          ["Mentés"],
        ),
        el("button", { id: "cancel", hidden: true, onClick: this.onCancel }, [
          "Mégse",
        ]),
        el(
          "button",
          {
            id: "delete",
            onClick: this.onDelete,
          },
          ["Törlés"],
        ),
      ]);
    }

    return el("div");
  }

  updateProfileHeaderDetailsDOM() {
    const elements = this._elements;
    const container = elements.profileHeaderDetails;
    if (!container) return;

    const cache = this._headerCache;
    const state = this._profileData;

    const editable = this.shouldShowEditors;
    const key = editable ? "editable" : "readonly";

    if (cache.active === key) return;
    cache.active = key;

    if (!cache[key]) {
      cache[key] = this.buildHeaderDetailsDOM(state, editable);
    }

    container.replaceChildren(cache[key]);

    elements.profileName = container.querySelector(".profile-name");
    elements.profileDescription = container.querySelector(
      ".profile-description",
    );
  }

  // prettier-ignore
  updateProfileHeaderActions() {
    const elements = this._elements;
    const container = elements.profileHeaderActions;
    if (!container) return;
    
    const cache = this._actionsCache;

    const isOwnProfile = this._profileData?.user_id === window?.VoidVanguard?.user?.id
    const canEdit = isOwnProfile || (this.admin && isAdmin());

    const showRelationshipControls =
      isLoggedIn() &&
      this._profileData.user_id != null &&
      !canEdit;

    let key;
    
    if (showRelationshipControls) {
      key = "controls";
    } else if (canEdit) {
      key = "edit";
    } else {
      key = "none";
    }

    if (cache.active === key) return;
    cache.active = key;
    
    if (!cache[key]) {
      cache[key] = this.buildProfileHeaderActionsDOM(showRelationshipControls, canEdit);
    }

    container.replaceChildren(cache[key]);

    elements.friendshipActionButton = container.querySelector("friendship-action-button");
    elements.blockActionButton = container.querySelector("block-action-button");
    elements.saveButton = container.querySelector("#save");
    elements.cancelButton = container.querySelector("#cancel");
    elements.deleteButton = container.querySelector("#delete")
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
          <comment-section controls="pagination" page-size="2" ${this.admin ? "admin" : ""}>
            <comment-form ${this.admin ? "admin" : ""}></comment-form>
          </comment-section>
        </div>
      </div>

      <div>
        <fullscreen-overlay id="profile-form" no-close hidden>
          <profile-form ${this.admin ? "admin" : ""} self-sign></profile-form>
        </fullscreen-overlay>
        <fullscreen-overlay id="friend-list-full" hidden>
          <friend-list-full controls="pagination" page-size="6"></friend-list-full>
        </fullscreen-overlay>
      </div>
    `;

    const elements = selectElements(this, this._elements);

    this.updateProfileHeaderDetailsDOM();
    this.updateProfileHeaderActions();

    elements.friendListFullToggle.addEventListener("click", function () {
      elements.friendListOverlay.hidden = false;
    });

    this._built = true;
  }

  async update(meta) {
    if (!this._built) this.build();

    const currentUserId = this.userId;
    const response = await net.send("/api/profiles/" + currentUserId);
    if (currentUserId !== this.userId) return;

    if (!response?.success) {
      console.error("Unable to fetch profile.");
      this.onError(response?.result);
      return;
    }

    this.updateContent(meta, response.result);
  }

  updateContent(meta, data = null) {
    if (!this._built) this.build();

    const prev = this._profileData;

    if (data) {
      this._previousProfileData = prev;
      this._profileData = data;
    }

    const state = this._profileData;
    const prevState = this._previousProfileData;

    this.updateProfileHeaderDetailsDOM();
    console.log(meta, isLoggedIn());
    this.updateProfileHeaderActions();

    this.renderActions(state, prevState);
    this.renderCoreFields(state, null);

    this.syncCommentSection(state);
    this.syncChildComponents(state, prevState);
    this.syncFriendshipVisibility(state, prevState);

    const elements = this._elements;

    if (elements.profileFormOverlay) {
      elements.profileFormOverlay.hidden = true;
    }

    if (
      meta?.origin === "friendshipStatusChangeHandler" ||
      meta?.origin === "blockStatusChangeHandler"
    ) {
      elements.friendListFull.refresh?.(); // if someone friend the user, it must show up on that list.
      elements.friendList.refresh?.();
    }

    // friendlist
    // if (state.friend_list_preview) {
    //   elements.friendList.data = state.friend_list_preview;
    // }

    if (Object.keys(state).length > 0) {
      elements.profileContainer.hidden = false;
      elements.errorMessage.hidden = true;
    }
  }

  renderActions(state, prev) {
    this.updateProfileHeaderActions();

    const { friendshipActionButton, blockActionButton, saveButton } =
      this._elements;

    if (friendshipActionButton) {
      friendshipActionButton.status = state.friendship_status;
    }

    if (blockActionButton) {
      blockActionButton.status = state.block_status;
    }

    if (saveButton) {
      saveButton.hidden = true;
    }
  }

  renderCoreFields(state, prev) {
    const { avatar, profileName, profileDescription } = this._elements;

    if (!avatar || !profileName || !profileDescription) return;

    if (!isEqual(state, prev, "avatar")) {
      avatar.src = state.avatar;
    }

    if (!isEqual(state, prev, "display_name")) {
      profileName.textContent = state.display_name;
    }

    if (!isEqual(state, prev, "description")) {
      profileDescription.textContent = state.description;
    }
  }

  syncChildComponents(state, prev) {
    if (!isEqual(state, prev, "user_id")) {
      this.setUserIdDependecies(state.user_id);
    }
  }

  setUserIdDependecies(userId) {
    const el = this._elements;

    el.friendshipActionButton?.setAttribute("user-id", userId);
    el.blockActionButton?.setAttribute("user-id", userId);
    el.friendList?.setAttribute("user-id", userId);
    el.friendListFull?.setAttribute("user-id", userId);

    el.commentForm?.setAttribute("target-id", userId);
    el.commentSection?.setAttribute("src", `/api/comments?targetId=${userId}`);
  }

  syncFriendshipVisibility(state, prev) {
    const button = this._elements.friendshipActionButton;
    if (!button) return;

    const wasBlocked = this.isBlocked(prev);
    const isBlocked = this.isBlocked(state);

    if (!isBlocked) {
      wasBlocked && button?.refresh();
      button.hidden = false;

      return;
    }

    button.hidden = true;
  }

  syncCommentSection(state) {
    const commentSection = this._elements.commentSection;
    if (!commentSection) return;

    if (this.isBlocked(state)) {
      commentSection.removeAttribute("can-comment");
    } else {
      commentSection.setAttribute("can-comment", "");
    }
  }

  isBlocked(state) {
    if (!state || !state?.block_status) return false;
    return (
      state.block_status === "you-blocked" ||
      state.block_status === "got-blocked" ||
      state.block_status === "both-blocked"
    );
  }
}

window.customElements.define("full-profile", FullProfile);
