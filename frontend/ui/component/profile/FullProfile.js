/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/profile/FullProfile.js
 * Szerep: Teljes profilnezet adatokkal, listakkal es muveleti gombokkal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
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
import NetworkErrorHandler from "/common/NetworkErrorHandler.js";
import ToastManager from "/ui/component/feedback/ToastManager.js";

import "/ui/component/validator/DisplayNameInputValidator.js";
import "/ui/component/validator/DescriptionInputValidator.js";

function getFriendshipRequestMethod(status) {
  switch (status) {
    case "not-friends":
      return "POST";
    case "received":
      return "PATCH";
    case "accepted":
    case "sent":
      return "DELETE";
    default:
      return null;
  }
}

function getBlockRequestMethod(status) {
  switch (status) {
    case "you-blocked":
    case "both-blocked":
      return "DELETE";
    case "got-blocked":
    case "not-blocked":
      return "POST";
    default:
      return null;
  }
}

function getFriendshipButtonText(status) {
  switch (status) {
    case "accepted":
      return "Barát eltávolítása";
    case "not-friends":
      return "Barát hozzáadása";
    case "received":
      return "Barátkérelem elfogadása";
    case "sent":
      return "Barátkérelem törlése";
    default:
      return "";
  }
}

function getBlockButtonText(status) {
  switch (status) {
    case "you-blocked":
    case "both-blocked":
      return "Tiltás feloldása";
    default:
      return "Felhasználó letiltása";
  }
}

// name - selector
const TO_SELECT = new Map([
  ["profileContainer", ".profile-container"],
  ["guestProfileMessage", ".guest-profile-message"],
  ["errorMessage", ".error"],
  ["avatarShell", ".avatar-shell"],
  ["avatar", ".avatar"],
  ["avatarEmptyText", ".avatar-empty-text"],
  ["profileHeaderDetails", ".profile-header-details"],
  ["profileHeaderActions", ".profile-header-actions"],
  ["friendList", "friend-list-preview"],
  ["commentSection", "comment-section"],
  ["commentForm", "comment-form"],
  ["profileFormOverlay", "#profile-form"],
  ["missingProfileMessage", "#missing-profile-message"],
  ["openProfileCreateBtn", "#open-profile-create"],
  ["profileCreateForm", "#profile-create-form"],
  ["continueWithoutProfileBtn", "#continue-without-profile"],
  ["profileBodyCreateBtn", "#profile-body-create"],
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
  ["friend-preview-state-change", "onFriendPreviewStateChange"],
  ["profile-create", "onProfileCreate"],
  ["inline-edit", "onInlineEdit"],
]);

const DEFAULT_AVATAR_PATHS = Object.freeze([
  "/image/defaultPfp.png",
  "/image/defaultPfp2.png",
  "/image/defaultPfp3.png",
  "/image/defaultPfp4.png",
  "/image/defaultPfp5.png",
  "/image/defaultPfp6.png",
]);
const DEFAULT_AVATAR_PATH = DEFAULT_AVATAR_PATHS[0];

function normalizeAvatarPath(path) {
  return DEFAULT_AVATAR_PATHS.includes(path) ? path : DEFAULT_AVATAR_PATH;
}

const EMPTY_AVATAR_SRC = "/image/defaultPfp.png";
const BIO_PLACEHOLDER_TEXT = "Ide írd a profilod leírását";
const LEGACY_BIO_PLACEHOLDER_TEXT = "Ide írd a profilodnak leírását";
const OWN_PROFILE_EMPTY_DESCRIPTION_TEXT =
  "Jelenleg a profilod leírása üres. Itt módosíthatod!";

function sanitizeDescription(value) {
  const normalized = (value ?? "").trim();

  if (
    normalized === BIO_PLACEHOLDER_TEXT ||
    normalized === LEGACY_BIO_PLACEHOLDER_TEXT
  ) {
    return "";
  }

  return normalized;
}

function normalizeVisibility(value) {
  if (value === "public" || value === "friends-only") {
    return value;
  }

  return "private";
}

const VISIBILITY_ORDER = ["public", "friends-only", "private"];

function getVisibilityLabel(value) {
  const normalized = normalizeVisibility(value);

  if (normalized === "public") return "Nyilvános";
  if (normalized === "friends-only") return "Csak barátok";
  return "Privát";
}

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
    const hasUserContext = !!window?.VoidVanguard?.user?.id;

    return (
      hasUserContext &&
      this._profileData?.has_profile !== false &&
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

    this._activeLoadToken = null;

    this._changed = new Set();
    this._editing = false;
    this._avatarPickerExpanded = false;
    this._skipProfileCreationPrompt = false;

    this._hasOngoingRelationshipUpdate = false;

    this._built = false;

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onFriendListChange = this.onFriendListChange.bind(this);
    this.onFriendshipButtonClick = this.onFriendshipButtonClick.bind(this);
    this.onBlockButtonClick = this.onBlockButtonClick.bind(this);
    this.onFriendPreviewStateChange =
      this.onFriendPreviewStateChange.bind(this);
    this.onProfileCreate = this.onProfileCreate.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onInlineEdit = this.onInlineEdit.bind(this);
    this.onProfileFieldInput = this.onProfileFieldInput.bind(this);
    this.onDescriptionEditorFocus = this.onDescriptionEditorFocus.bind(this);
    this.onAvatarSelectionChange = this.onAvatarSelectionChange.bind(this);
    this.onAvatarShellClick = this.onAvatarShellClick.bind(this);
    this.onAvatarEditorBackdropClick =
      this.onAvatarEditorBackdropClick.bind(this);
    this.onAvatarEditorCloseClick = this.onAvatarEditorCloseClick.bind(this);
    this.onVisibilityToggleClick = this.onVisibilityToggleClick.bind(this);
    this.onOpenProfileCreate = this.onOpenProfileCreate.bind(this);
    this.onContinueWithoutProfile = this.onContinueWithoutProfile.bind(this);
  }

  get isOwnProfile() {
    return (
      this._profileData?.user_id != null &&
      String(this._profileData.user_id) ===
        String(window?.VoidVanguard?.user?.id)
    );
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "user-id" && oldValue !== newValue) {
      requestAnimationFrame(() =>
        this.update({ origin: "attributeChangedCallback" }),
      );
    }
  }

  onLogin(e) {
    this.syncGuestPresentation();
    if (!this.userId) return;
    this.update({ origin: "onLogin" });
  }

  onLogout(e) {
    this.syncGuestPresentation();
    if (!this.userId) return;
    this.update({ origin: "onLogout" });
  }

  disableActionButtons(disabled) {
    const fbutton = this._elements.friendshipButton;
    fbutton && (fbutton.disabled = disabled);

    const bbutton = this._elements.blockButton;
    bbutton && (bbutton.disabled = disabled);
  }

  async onFriendshipButtonClick(e) {
    if (this._hasOngoingRelationshipUpdate) return;
    this._hasOngoingRelationshipUpdate = true;

    if (!this.userId) return;

    this.disableActionButtons(true);

    const formData = new FormData();
    formData.set("userId", this.userId);

    const response = await net.send("/api/friends", {
      method: getFriendshipRequestMethod(this._profileData.friendship_status),
      body: formData,
    });

    this.update({ origin: "onFriendshipButtonClick" });

    this._hasOngoingRelationshipUpdate = false;
    this.disableActionButtons(false);
  }

  async onBlockButtonClick(e) {
    if (this._hasOngoingRelationshipUpdate) return;
    this._hasOngoingRelationshipUpdate = true;

    if (!this.userId) return;

    this.disableActionButtons(true);

    const formData = new FormData();
    formData.set("userId", this.userId);

    const response = await net.send("/api/blocks", {
      method: getBlockRequestMethod(this._profileData.block_status),
      body: formData,
    });

    this.update({ origin: "onBlockButtonClick" });

    this._hasOngoingRelationshipUpdate = false;
    this.disableActionButtons(false);
  }

  onFriendListChange(e) {
    if (this.userId === e?.detail?.userId) {
      const { friendList } = this._elements;
      if (!friendList) return;

      friendList.refresh?.();
    }
  }

  onFriendPreviewStateChange(e) {
    const showFullListButton = !!e?.detail?.hasMoreThanPreview;
    const { friendListFullToggle } = this._elements;

    if (!friendListFullToggle) return;
    friendListFullToggle.hidden = !showFullListButton;
  }

  onAvatarShellClick() {
    if (!this.shouldShowEditors || !this.isOwnProfile) return;

    this._avatarPickerExpanded = !this._avatarPickerExpanded;
    this.syncAvatarPickerUI();
  }

  onAvatarEditorBackdropClick(e) {
    if (e?.target !== e?.currentTarget) return;

    this._avatarPickerExpanded = false;
    this.syncAvatarPickerUI();
  }

  onAvatarEditorCloseClick() {
    this._avatarPickerExpanded = false;
    this.syncAvatarPickerUI();
  }

  onProfileCreate(e) {
    const profileData = e.detail?.result;
    if (!profileData) return;

    this.updateContent({ origin: "onProfileCreate" }, profileData);

    if (this._elements.profileFormOverlay) {
      this._elements.profileFormOverlay.hidden = true;
    }

    if (this._elements.profileCreateForm) {
      this._elements.profileCreateForm.hidden = true;
    }

    this._elements.commentSection?.refresh?.();
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

    if (
      NetworkErrorHandler.handle(response, {
        context: "FullProfile.onDelete",
      })
    ) {
      return;
    }

    this.update({ origin: "profileDeletionHandler" });
  }

  async onSave(e) {
    const form = this.querySelector("form");
    if (!form) return;

    const formData = new FormData(form);

    const description = sanitizeDescription(formData.get("description"));
    formData.set("description", description);

    /** admin */
    if (this.admin && isAdmin()) {
      formData.append("targetUserId", this.userId);
    }

    const response = await net.send("/api/profiles", {
      method: "PATCH",
      body: formData,
    });

    if (
      NetworkErrorHandler.handle(response, {
        context: "FullProfile.onSave",
      })
    ) {
      return;
    }

    ToastManager.SUCCESS(response?.message || "Profil sikeresen mentve");

    this._changed.clear();
    this.toggleEditing();

    this.update({ origin: "profileUpdateHandler" });
  }

  onCancel(e) {
    this._changed.clear();
    this.toggleEditing();
    this.renderCoreFields(this._profileData, null);
  }

  onOpenProfileCreate() {
    this._skipProfileCreationPrompt = false;

    const overlay = this._elements.profileFormOverlay;
    const form = this._elements.profileCreateForm;
    const openButton = this._elements.openProfileCreateBtn;
    const continueButton = this._elements.continueWithoutProfileBtn;

    if (overlay) {
      overlay.hidden = false;
    }

    if (openButton) {
      openButton.hidden = true;
    }

    if (continueButton) {
      continueButton.hidden = false;
    }

    if (form) {
      form.action = "create";
      form.dispatchEvent(new Event("reset"));
      form.hidden = false;
    }
  }

  onContinueWithoutProfile() {
    this._skipProfileCreationPrompt = true;

    if (this._elements.profileFormOverlay) {
      this._elements.profileFormOverlay.hidden = true;
    }
  }

  onInlineEdit(e) {
    e.stopPropagation();

    const newValue = e.detail?.newValue;
    const propName = e.detail?.name;

    if (!propName) return;

    const currentValue = this._profileData?.[propName] ?? "";
    const comparableCurrentValue =
      propName === "description"
        ? sanitizeDescription(currentValue)
        : currentValue;
    const comparableNewValue =
      propName === "description" ? sanitizeDescription(newValue) : newValue;

    if (!Object.is(comparableCurrentValue, comparableNewValue)) {
      this._changed.add(propName);
    } else {
      this._changed.delete(propName);
    }

    if (propName === "description") {
      const profileDescription = this._elements?.profileDescription;
      const isOwnProfile =
        this._profileData?.user_id != null &&
        String(this._profileData.user_id) ===
          String(window?.VoidVanguard?.user?.id);
      const normalized = sanitizeDescription(newValue);
      const shouldShowOwnProfilePlaceholder = isOwnProfile && !normalized;

      if (profileDescription) {
        profileDescription.textContent = shouldShowOwnProfilePlaceholder
          ? OWN_PROFILE_EMPTY_DESCRIPTION_TEXT
          : normalized;
        profileDescription.classList.toggle(
          "profile-description-placeholder",
          shouldShowOwnProfilePlaceholder,
        );
      }
    }

    this.toggleEditing();
  }

  onDescriptionEditorFocus(e) {
    const field = e?.target;
    if (!field || field.name !== "description") return;

    if (field.value === OWN_PROFILE_EMPTY_DESCRIPTION_TEXT) {
      field.value = "";
    }
  }

  onProfileFieldInput(e) {
    const field = e?.target;
    const propName = field?.name;

    if (!propName) return;

    const newValue = field.value ?? "";
    const currentValue = this._profileData?.[propName] ?? "";
    const comparableCurrentValue =
      propName === "description"
        ? sanitizeDescription(currentValue)
        : currentValue;
    const comparableNewValue =
      propName === "description" ? sanitizeDescription(newValue) : newValue;

    if (!Object.is(comparableCurrentValue, comparableNewValue)) {
      this._changed.add(propName);
    } else {
      this._changed.delete(propName);
    }

    if (propName === "description") {
      const profileDescription = this._elements?.profileDescription;
      const isOwnProfile =
        this._profileData?.user_id != null &&
        String(this._profileData.user_id) ===
          String(window?.VoidVanguard?.user?.id);
      const normalized = sanitizeDescription(newValue);
      const shouldShowOwnProfilePlaceholder = isOwnProfile && !normalized;

      if (profileDescription) {
        profileDescription.textContent = shouldShowOwnProfilePlaceholder
          ? OWN_PROFILE_EMPTY_DESCRIPTION_TEXT
          : normalized;
        profileDescription.classList.toggle(
          "profile-description-placeholder",
          shouldShowOwnProfilePlaceholder,
        );
      }
    }

    this.toggleEditing();
  }

  onAvatarSelectionChange(e) {
    const avatarPath = e?.target?.value;
    if (!avatarPath) return;

    const normalizedAvatarPath = normalizeAvatarPath(avatarPath);
    const currentAvatarPath = normalizeAvatarPath(this._profileData?.avatar);

    if (normalizedAvatarPath !== currentAvatarPath) {
      this._changed.add("avatar");
    } else {
      this._changed.delete("avatar");
    }

    if (this._elements.avatar) {
      this._elements.avatar.src = normalizedAvatarPath;
    }

    this.toggleEditing();
  }

  onVisibilityToggleClick() {
    const visibilityInput = this.querySelector('input[name="visibility"]');
    const visibilityButtons = this.querySelectorAll(
      ".profile-visibility-toggle",
    );

    if (!visibilityInput || visibilityButtons.length === 0) return;

    const currentVisibility = normalizeVisibility(visibilityInput.value);
    const currentIndex = VISIBILITY_ORDER.indexOf(currentVisibility);
    const nextVisibility =
      VISIBILITY_ORDER[(currentIndex + 1) % VISIBILITY_ORDER.length];

    visibilityInput.value = nextVisibility;
    visibilityButtons.forEach((button) => {
      button.textContent = getVisibilityLabel(nextVisibility);
    });

    const currentProfileVisibility = normalizeVisibility(
      this._profileData?.visibility,
    );

    if (nextVisibility !== currentProfileVisibility) {
      this._changed.add("visibility");
    } else {
      this._changed.delete("visibility");
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
    this._skipProfileCreationPrompt = false;

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
      this._skipProfileCreationPrompt = false;
      elements.profileFormOverlay.hidden = false;

      if (elements.openProfileCreateBtn) {
        elements.openProfileCreateBtn.hidden = false;
      }

      if (elements.profileCreateForm) {
        elements.profileCreateForm.hidden = true;
      }

      if (elements.continueWithoutProfileBtn) {
        elements.continueWithoutProfileBtn.hidden = false;
      }

      if (elements.profileBodyCreateBtn) {
        elements.profileBodyCreateBtn.hidden = false;
      }

      if (elements.missingProfileMessage) {
        const username = window?.VoidVanguard?.user?.username;
        const mention = username ? `(@${username})` : "(@ismeretlen)";
        elements.missingProfileMessage.textContent = `Profil létrehozása ${mention} felhasználó számára.`;
        elements.missingProfileMessage.hidden = false;
      }
    }
  }

  buildHeaderDetailsDOM(data, editable) {
    const username = data.username ? `@${data.username}` : "";
    const description = sanitizeDescription(data.description);

    if (!editable) {
      return el("div", {}, [
        el("div", { class: "profile-name" }, [data.display_name ?? ""]),
        el("div", { class: "profile-username" }, [username]),
        el("div", { class: "profile-description" }, [description]),
      ]);
    }

    return el("form", {}, [
      el("div", { class: "profile-avatar-editor", hidden: true }, [
        el("div", { class: "profile-avatar-editor-head" }, [
          el("p", { class: "profile-avatar-editor-label" }, [
            "Válassz egy profilképet!",
          ]),
          el(
            "button",
            {
              type: "button",
              "data-sfx": "click_1",
              class: "profile-avatar-editor-close",
              onClick: this.onAvatarEditorCloseClick,
            },
            ["Bezárás"],
          ),
        ]),
        el("div", { class: "profile-avatar-picker" }, [
          el("label", { class: "avatar-choice" }, [
            el("input", {
              type: "radio",
              name: "avatar",
              value: "/image/defaultPfp.png",
            }),
            el("img", {
              draggable: "false",
              src: "/image/defaultPfp.png",
              alt: "Alap profilkep 1",
            }),
          ]),
          el("label", { class: "avatar-choice" }, [
            el("input", {
              type: "radio",
              name: "avatar",
              value: "/image/defaultPfp2.png",
            }),
            el("img", {
              draggable: "false",
              src: "/image/defaultPfp2.png",
              alt: "Alap profilkep 2",
            }),
          ]),
          el("label", { class: "avatar-choice" }, [
            el("input", {
              type: "radio",
              name: "avatar",
              value: "/image/defaultPfp3.png",
            }),
            el("img", {
              draggable: "false",
              src: "/image/defaultPfp3.png",
              alt: "Alap profilkep 3",
            }),
          ]),
          el("label", { class: "avatar-choice" }, [
            el("input", {
              type: "radio",
              name: "avatar",
              value: "/image/defaultPfp4.png",
            }),
            el("img", {
              draggable: "false",
              src: "/image/defaultPfp4.png",
              alt: "Alap profilkep 4",
            }),
          ]),
          el("label", { class: "avatar-choice" }, [
            el("input", {
              type: "radio",
              name: "avatar",
              value: "/image/defaultPfp5.png",
            }),
            el("img", {
              draggable: "false",
              src: "/image/defaultPfp5.png",
              alt: "Alap profilkep 5",
            }),
          ]),
          el("label", { class: "avatar-choice" }, [
            el("input", {
              type: "radio",
              name: "avatar",
              value: "/image/defaultPfp6.png",
            }),
            el("img", {
              draggable: "false",
              src: "/image/defaultPfp6.png",
              alt: "Alap profilkep 6",
            }),
          ]),
        ]),
      ]),

      el("input", {
        type: "hidden",
        name: "visibility",
        value: normalizeVisibility(data.visibility),
      }),

      el(
        "div",
        {
          class: "profile-visibility-editor profile-visibility-editor-desktop",
        },
        [
          el("p", { class: "profile-visibility-editor-label" }, [
            "Profil láthatósága",
          ]),
          el(
            "button",
            {
              type: "button",
              "data-sfx": "click_1",
              class: "profile-visibility-toggle",
            },
            [getVisibilityLabel(data.visibility)],
          ),
        ],
      ),

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

      el("div", { class: "profile-username" }, [username]),

      el("inline-editor", {}, [
        el("dashed-border-box", {}, [
          el(
            "div",
            {
              class: "profile-description",
              "data-text": "",
            },
            [description],
          ),
        ]),
        el("description-input-validator", { "disable-on-invalid": "#save" }, [
          el("textarea", {
            "data-editor": "",
            name: "description",
            placeholder: BIO_PLACEHOLDER_TEXT,
          }),
        ]),
      ]),
    ]);
  }

  buildProfileHeaderActionsDOM(showRelationshipControls, canEdit) {
    if (showRelationshipControls) {
      return el("div", {}, [
        el(
          "button",
          {
            id: "friendship-controller",
            "data-sfx": "click_1",
            onClick: this.onFriendshipButtonClick,
          },
          ["Barát hozzáadása"],
        ),
        el(
          "button",
          {
            id: "block-controller",
            "data-sfx": "click_1",
            onClick: this.onBlockButtonClick,
          },
          ["Felhasználó letiltása"],
        ),
      ]);
    }

    if (canEdit) {
      return el("div", { class: "editor-actions" }, [
        el(
          "button",
          {
            id: "save",
            hidden: true,
            "data-sfx": "click_1",
            onClick: this.onSave,
          },
          ["Mentés"],
        ),
        el(
          "button",
          {
            id: "cancel",
            "data-sfx": "click_1",
            hidden: true,
            onClick: this.onCancel,
          },
          ["Mégse"],
        ),
        el(
          "button",
          {
            id: "delete",
            "data-sfx": "click_1",
            onClick: this.onDelete,
          },
          ["Törlés"],
        ),
        el(
          "div",
          {
            class: "profile-visibility-editor profile-visibility-editor-mobile",
          },
          [
            el("p", { class: "profile-visibility-editor-label" }, [
              "Profil láthatósága",
            ]),
            el(
              "button",
              {
                type: "button",
                "data-sfx": "click_1",
                class: "profile-visibility-toggle",
              },
              [getVisibilityLabel(this._profileData?.visibility)],
            ),
          ],
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
    elements.profileUsername = container.querySelector(".profile-username");
    elements.profileDescription = container.querySelector(
      ".profile-description",
    );

    const avatarInputs = container.querySelectorAll('input[name="avatar"]');

    avatarInputs.forEach((input) => {
      input.removeEventListener("change", this.onAvatarSelectionChange);
      input.addEventListener("change", this.onAvatarSelectionChange);
    });

    const editableFields = container.querySelectorAll(
      'input[name="display_name"], textarea[name="description"]',
    );

    editableFields.forEach((field) => {
      field.removeEventListener("input", this.onProfileFieldInput);
      field.addEventListener("input", this.onProfileFieldInput);

      if (field.name === "description") {
        field.removeEventListener("focus", this.onDescriptionEditorFocus);
        field.addEventListener("focus", this.onDescriptionEditorFocus);
      }
    });

    const visibilityToggles = container.querySelectorAll(
      ".profile-visibility-toggle",
    );
    visibilityToggles.forEach((toggle) => {
      toggle.removeEventListener("click", this.onVisibilityToggleClick);
      toggle.addEventListener("click", this.onVisibilityToggleClick);
    });

    const avatarEditor = container.querySelector(".profile-avatar-editor");
    if (avatarEditor) {
      avatarEditor.removeEventListener(
        "click",
        this.onAvatarEditorBackdropClick,
      );
      avatarEditor.addEventListener("click", this.onAvatarEditorBackdropClick);
    }

    this.syncAvatarPickerUI();
  }

  syncAvatarPickerUI() {
    const { avatarShell, profileHeaderDetails } = this._elements;
    const avatarEditor = profileHeaderDetails?.querySelector(
      ".profile-avatar-editor",
    );
    const canToggleAvatarPicker =
      this.shouldShowEditors && this.isOwnProfile && !!avatarEditor;

    if (avatarShell) {
      avatarShell.classList.toggle(
        "avatar-shell-clickable",
        canToggleAvatarPicker,
      );
      avatarShell.setAttribute(
        "title",
        canToggleAvatarPicker ? "Kattints a profilkép módosításához" : "",
      );
      avatarShell.setAttribute(
        "aria-expanded",
        String(canToggleAvatarPicker && this._avatarPickerExpanded),
      );
    }

    if (!canToggleAvatarPicker) {
      this._avatarPickerExpanded = false;
    }

    if (avatarEditor) {
      avatarEditor.hidden =
        !canToggleAvatarPicker || !this._avatarPickerExpanded;
    }
  }

  // prettier-ignore
  updateProfileHeaderActions() {
    const elements = this._elements;
    const container = elements.profileHeaderActions;
    if (!container) return;
    
    const cache = this._actionsCache;

    const isOwnProfile =
      this._profileData?.user_id != null &&
      String(this._profileData.user_id) === String(window?.VoidVanguard?.user?.id);
    const hasUserContext = !!window?.VoidVanguard?.user?.id;
    const canEdit =
      hasUserContext &&
      this._profileData?.has_profile !== false &&
      this._profileData?.user_id != null &&
      (isOwnProfile || (this.admin && isAdmin()));

    const showRelationshipControls =
      hasUserContext &&
      this._profileData.user_id != null &&
      !canEdit &&
      !isOwnProfile;

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

    elements.friendshipButton = container.querySelector("#friendship-controller");
    elements.blockButton = container.querySelector("#block-controller");
    elements.saveButton = container.querySelector("#save");
    elements.cancelButton = container.querySelector("#cancel");
    elements.deleteButton = container.querySelector("#delete");

    const visibilityToggles = container.querySelectorAll(".profile-visibility-toggle");
    visibilityToggles.forEach((toggle) => {
      toggle.removeEventListener("click", this.onVisibilityToggleClick);
      toggle.addEventListener("click", this.onVisibilityToggleClick);
    });
  }

  build() {
    if (this._built) return;

    this.innerHTML = `
      <div class="error" hidden>
        <h1>Hiba történt a profil betöltése közben</h1>
      </div>

      <div class="profile-container">
        <div class="guest-profile-message" hidden>
          Nem regisztrált fiókoknak nem jeleníthető meg profil. Kérlek, regisztrálj!
        </div>
        <div class="profile-header">
            <div class="avatar-shell">
              <img draggable="false" class="avatar skeleton" />
              <div class="avatar-empty-text" hidden>Ez a fiók nem rendelkezik profillal</div>
            </div>

            <div class="profile-header-details"></div>
            <div class="profile-header-actions">
            </div>
        </div>
        <div class="profile-two-column">
          <div class="profile-body">
            <div>
              <div class="profile-body-actions">
                <button id="friend-list-full-toggle" data-sfx="click_1" type="button" hidden>Összes barát megtekintése</button>
                <button id="profile-body-create" type="button" data-sfx="click_1" hidden>Profil létrehozása</button>
              </div>
              <p class="friend-list-preview-label">Barátok előnézete</p>
              <friend-list-preview></friend-list-preview>
            </div>
          </div>
          <div class="profile-footer">
            <p class="comment-section-label">Kommentek</p>
            <comment-section controls="scroll" page-size="2" ${this.admin ? "admin" : ""}>
              <comment-form ${this.admin ? "admin" : ""}></comment-form>
            </comment-section>
          </div>
        </div>
      </div>

      <div>
        <fullscreen-overlay id="profile-form" no-close hidden>
          <p id="missing-profile-message" hidden></p>
          <button id="open-profile-create" type="button" data-sfx="click_1">Profil létrehozása</button>
          <profile-form id="profile-create-form" ${this.admin ? "admin" : ""} self-sign hidden></profile-form>
          <button id="continue-without-profile" type="button" data-sfx="click_1">Folytatás profil létrehozása nélkül</button>
        </fullscreen-overlay>
        <fullscreen-overlay id="friend-list-full" hidden>
          <friend-list-full controls="pagination" page-size="6"></friend-list-full>
        </fullscreen-overlay>
      </div>
    `;

    const elements = selectElements(this, this._elements);

    elements.avatarShell?.addEventListener("click", this.onAvatarShellClick);

    this.updateProfileHeaderDetailsDOM();
    this.updateProfileHeaderActions();

    elements.friendListFullToggle.addEventListener("click", function () {
      elements.friendListOverlay.hidden = false;
    });

    elements.openProfileCreateBtn?.addEventListener(
      "click",
      this.onOpenProfileCreate,
    );

    elements.profileBodyCreateBtn?.addEventListener(
      "click",
      this.onOpenProfileCreate,
    );

    elements.continueWithoutProfileBtn?.addEventListener(
      "click",
      this.onContinueWithoutProfile,
    );

    // Apply guest lock immediately, even before first profile fetch resolves.
    this.syncGuestPresentation();

    this._built = true;
  }

  async update(meta) {
    if (!this._built) this.build();

    // console.log("UPDATE META: ", meta);

    const currentUserId = this.userId;
    const loadToken = Symbol();
    this._activeLoadToken = loadToken;

    const hasUserContext = !!window?.VoidVanguard?.user?.id;
    const response = await net.send(
      "/api/profiles/" + currentUserId,
      { method: "GET" },
      hasUserContext,
    );

    if (this._activeLoadToken !== loadToken) return;
    // if (currentUserId !== this.userId) return;

    if (
      NetworkErrorHandler.handle(response, {
        context: "FullProfile.update",
      })
    ) {
      this.onError(response?.result);
      return;
    }

    this.updateContent(meta, response.result);
  }

  updateContent(meta, data = null) {
    if (!this._built) this.build();

    const prev = this._profileData;

    if (data) {
      const sanitizedData = {
        ...data,
        description: sanitizeDescription(data.description),
      };

      this._previousProfileData = prev;
      this._profileData = sanitizedData;
    }

    const state = this._profileData;
    const prevState = this._previousProfileData;

    if (!this.isOwnProfile) {
      this._avatarPickerExpanded = false;
    }

    this.updateProfileHeaderDetailsDOM();
    this.updateProfileHeaderActions();
    this.syncGuestPresentation();

    this.renderActions(state, prevState);
    this.renderCoreFields(state, null);
    this.syncAvatarPickerUI();

    this.syncCommentSection(state);
    this.syncChildComponents(state, prevState);
    this.syncFriendshipVisibility(state, prevState);

    const elements = this._elements;

    if (elements.profileFormOverlay) {
      const isOwnProfile =
        state?.user_id != null &&
        String(state.user_id) === String(window?.VoidVanguard?.user?.id);
      const hasProfile = state?.has_profile !== false;
      const username = state?.username ?? window?.VoidVanguard?.user?.username;

      const canAdminCreate = this.admin && isAdmin();
      const canCreateProfile = !hasProfile && (isOwnProfile || canAdminCreate);
      const forceOpenCreate = this.hasAttribute("open-profile-create");
      const missingProfileMessage = elements.missingProfileMessage;

      if (elements.profileBodyCreateBtn) {
        elements.profileBodyCreateBtn.hidden = !canCreateProfile;
      }

      if (
        canCreateProfile &&
        (!this._skipProfileCreationPrompt || canAdminCreate || forceOpenCreate)
      ) {
        elements.profileFormOverlay.hidden = false;

        if (missingProfileMessage) {
          const mention = username ? `(@${username})` : "(@ismeretlen)";
          missingProfileMessage.textContent = `Profil létrehozása ${mention} felhasználó számára.`;
          missingProfileMessage.hidden = false;
        }

        if (elements.openProfileCreateBtn) {
          elements.openProfileCreateBtn.hidden = forceOpenCreate;
        }
        if (elements.profileCreateForm) {
          elements.profileCreateForm.hidden = !forceOpenCreate;
        }
        if (elements.continueWithoutProfileBtn) {
          elements.continueWithoutProfileBtn.hidden = false;
        }
      } else {
        elements.profileFormOverlay.hidden = true;
        if (missingProfileMessage) {
          missingProfileMessage.hidden = true;
        }
      }

      if (forceOpenCreate) {
        this.removeAttribute("open-profile-create");
      }
    }

    if (
      meta?.origin === "friendshipStatusChangeHandler" ||
      meta?.origin === "blockStatusChangeHandler" ||
      meta?.origin === "onLogin" ||
      meta?.origin === "onLogout" ||
      meta?.origin === "attributeChangedCallback"
    ) {
      elements.friendListFull.refresh?.(); // if someone friend the user, it must show up on that list.
      elements.friendList.refresh?.();
    }

    if (Object.keys(state).length > 0) {
      elements.profileContainer.hidden = false;
      elements.errorMessage.hidden = true;
    }
  }

  renderActions(state, prev) {
    this.updateProfileHeaderActions();

    const { friendshipButton, blockButton, saveButton } = this._elements;

    this.updateFriendshipButtonText();
    this.updateBlockButtonText();

    if (saveButton) {
      saveButton.hidden = true;
    }
  }

  renderCoreFields(state, prev) {
    const {
      avatar,
      avatarShell,
      avatarEmptyText,
      profileName,
      profileUsername,
      profileDescription,
    } = this._elements;

    if (!avatar || !profileName || !profileDescription) return;

    const hasProfile = state?.has_profile !== false;

    if (
      !isEqual(state, prev, "avatar") ||
      !isEqual(state, prev, "has_profile")
    ) {
      avatar.src = hasProfile && state.avatar ? state.avatar : EMPTY_AVATAR_SRC;
      avatar.classList.remove("skeleton");
      avatar.classList.toggle("no-profile-avatar", !hasProfile);
      avatarShell?.classList.toggle("no-profile-avatar", !hasProfile);
      if (avatarEmptyText) {
        avatarEmptyText.hidden = hasProfile;
      }
    }

    const avatarPath = normalizeAvatarPath(state.avatar);
    const avatarInput = this.querySelector(
      `input[name="avatar"][value="${avatarPath}"]`,
    );
    if (avatarInput) {
      avatarInput.checked = true;
    }

    const normalizedVisibility = normalizeVisibility(state.visibility);
    const visibilityInput = this.querySelector('input[name="visibility"]');
    const visibilityButtons = this.querySelectorAll(
      ".profile-visibility-toggle",
    );

    if (visibilityInput) {
      visibilityInput.value = normalizedVisibility;
    }

    visibilityButtons.forEach((button) => {
      button.textContent = getVisibilityLabel(normalizedVisibility);
    });

    if (!isEqual(state, prev, "display_name")) {
      profileName.textContent = state.display_name;
    }

    if (profileUsername && !isEqual(state, prev, "username")) {
      profileUsername.textContent = state.username ? `@${state.username}` : "";
    }

    if (
      !isEqual(state, prev, "description") ||
      !isEqual(state, prev, "has_profile")
    ) {
      const description = sanitizeDescription(state.description);
      const isOwnProfile =
        state?.user_id != null &&
        String(state.user_id) === String(window?.VoidVanguard?.user?.id);
      const shouldShowOwnProfilePlaceholder = isOwnProfile && !description;

      profileDescription.textContent = shouldShowOwnProfilePlaceholder
        ? OWN_PROFILE_EMPTY_DESCRIPTION_TEXT
        : description;
      profileDescription.classList.toggle(
        "profile-description-placeholder",
        shouldShowOwnProfilePlaceholder,
      );
    }
  }

  syncGuestPresentation() {
    const { profileContainer, guestProfileMessage } = this._elements;
    if (!profileContainer || !guestProfileMessage) return;

    const hasUserContext = !!window?.VoidVanguard?.user?.id;
    const isGuest = !isLoggedIn() && !hasUserContext;
    const hasExplicitTarget = !!this.userId && this.userId !== "profile";
    // Lock only when a guest opens the generic self-profile page (no explicit target user).
    const shouldLockProfile = isGuest && !hasExplicitTarget;

    const profileHeader = profileContainer.querySelector(".profile-header");
    const profileBody = profileContainer.querySelector(".profile-body");
    const profileFooter = profileContainer.querySelector(".profile-footer");

    guestProfileMessage.hidden = !shouldLockProfile;
    profileContainer.classList.toggle(
      "guest-profile-locked",
      shouldLockProfile,
    );

    if (profileHeader) {
      profileHeader.hidden = shouldLockProfile;
    }

    if (profileBody) {
      profileBody.hidden = shouldLockProfile;
    }

    if (profileFooter) {
      profileFooter.hidden = shouldLockProfile;
    }

    const friendListOverlay = this._elements.friendListOverlay;
    if (friendListOverlay && shouldLockProfile) {
      friendListOverlay.hidden = true;
    }
  }

  syncChildComponents(state, prev) {
    if (!isEqual(state, prev, "user_id")) {
      this.setUserIdDependecies(state.user_id);
    }
  }

  setUserIdDependecies(userId) {
    const el = this._elements;

    el.friendList?.setAttribute("user-id", userId);
    el.friendListFull?.setAttribute("user-id", userId);

    el.commentForm?.setAttribute("target-id", userId);
    el.commentSection?.setAttribute("src", `/api/comments?targetId=${userId}`);
  }

  updateFriendshipButtonText() {
    const button = this._elements.friendshipButton;
    if (!button) return;

    button.textContent = getFriendshipButtonText(
      this._profileData.friendship_status,
    );
  }

  updateBlockButtonText() {
    const button = this._elements.blockButton;
    if (!button) return;

    button.textContent = getBlockButtonText(this._profileData.block_status);
  }

  syncFriendshipVisibility(state, prev) {
    const button = this._elements.friendshipButton;
    if (!button) return;

    const wasBlocked = this.isBlocked(prev);
    const isBlocked = this.isBlocked(state);

    if (!isBlocked) {
      wasBlocked && this.updateFriendshipButtonText();
      button.hidden = false;

      return;
    }

    button.hidden = true;
  }

  syncCommentSection(state) {
    const commentSection = this._elements.commentSection;
    if (!commentSection) return;

    const hasUserContext = !!window?.VoidVanguard?.user?.id;

    if (state?.has_profile === false) {
      commentSection.hidden = true;
      commentSection.removeAttribute("can-comment");
      return;
    }

    commentSection.hidden = false;

    if (this.isBlocked(state) || !hasUserContext) {
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
