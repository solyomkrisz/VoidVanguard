import { isLoggedIn, isAdmin } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import "/ui/component/form/InlineEditor.js";
import "/ui/component/decorative/DashedBorderBox.js";
import "/ui/component/profile/CommentReactions.js";

export default class CommentItem extends HTMLElement {
  set comment(value) {
    this._comment = value;
    this.update(true);
  }

  get comment() {
    return this._comment;
  }

  get admin() {
    return this.hasAttribute("admin");
  }

  constructor() {
    super();

    this._comment = null;
    this._changed = new Set();
    this._editing = false;
    this._personalized = null;
    this._built = false;
    this._elements = {};

    this.onInlineEdit = this.onInlineEdit.bind(this);
    this.onFieldInput = this.onFieldInput.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onReactionsClick = this.onReactionsClick.bind(this);
  }

  connectedCallback() {
    this.build();

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  onInlineEdit(e) {
    e.stopPropagation();

    const newValue = e.detail?.newValue;
    const propName = e.detail?.name;

    if (!Object.is(this.comment[propName], newValue)) {
      this._changed.add(propName);
    } else {
      this._changed.delete(propName);
    }

    this.toggleEditing();
  }

  onFieldInput(e) {
    const field = e?.target;
    const propName = field?.name;
    if (!propName) return;

    const newValue = field.value ?? "";
    const currentValue = this.comment?.[propName] ?? "";

    if (!Object.is(currentValue, newValue)) {
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

  onLogin(e) {
    this.update();
  }

  onLogout(e) {
    this.update();
  }

  onReactionsClick(e) {
    if (e.currentTarget !== this) return;

    e.stopPropagation();

    const type = e.detail?.type;

    this.dispatchEvent(
      new CustomEvent("comment-reaction", {
        detail: {
          commentId: this.comment.id,
          type,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onSave(e) {
    const form = this._elements.form;
    if (!form || !(form instanceof HTMLFormElement)) return;

    const formData = new FormData(form);

    this.dispatchEvent(
      new CustomEvent("comment-update", {
        detail: {
          commentId: this.comment.id,
          formData,
        },
        bubbles: true,
        composed: false,
      }),
    );
  }

  onDelete(e) {
    this.dispatchEvent(
      new CustomEvent("comment-delete", {
        detail: {
          comment: this.comment,
        },
        bubbles: true,
        composed: false,
      }),
    );
  }

  renderAuthorLink() {
    const author = this.comment.author ?? "";
    const authorId = this.comment.author_id;

    if (!authorId) {
      return `<span class="comment-author-name">${author}</span>`;
    }

    return `<a class="comment-author-link" href="/profile/${authorId}">${author}</a>`;
  }

  renderAuthorAvatar() {
    const avatar = this.comment.author_avatar || "/image/defaultPfp.png";
    const author = this.comment.author ?? "User";
    const authorId = this.comment.author_id;
    const hasProfile = this.comment.author_has_profile !== 0;
    const avatarClass = hasProfile
      ? "comment-author-avatar"
      : "comment-author-avatar no-profile-avatar";
    const linkClass = hasProfile
      ? "comment-author-avatar-link"
      : "comment-author-avatar-link no-profile-avatar";
    const image = `<img class="${avatarClass}" src="${avatar}" alt="${author} profilkep" loading="lazy" decoding="async">`;

    if (!authorId) return image;

    return `<a class="${linkClass}" href="/profile/${authorId}" aria-label="${author} profilja">${image}</a>`;
  }

  getPersonalizedTemplate() {
    return `
      <form>
          <div class="comment-header">
              <div class="comment-author">
                ${this.renderAuthorAvatar()}
                <div class="comment-author-ident">${this.renderAuthorLink()}</div>
              </div>
              <div class="comment-meta">
                <span class="comment-created">${this.comment.created_at ?? ""}</span>
                ${this.comment.created_at === this.comment.updated_at ? "" : this.comment.updated_at ? `<span class="comment-updated">Szerkesztve: ${this.comment.updated_at}</span>` : ""}
              </div>
          </div>
          <div class="comment-body">
              <inline-editor>
                  <dashed-border-box>
                    <div data-text class="comment-content">${(this.comment.content ?? "").trim()}</div>
                  </dashed-border-box>
                  <textarea data-editor name="content"></textarea>
              </inline-editor>
          </div>
          <div class="comment-actions">
            <comment-reactions controls="both"></comment-reactions>
            <div class="comment-owner-actions">
              <button id="save" type="button" data-sfx="click_1" hidden>Mentés</button>
              <button id="delete" type="button" data-sfx="click_1">Törlés</button>
            </div>
          </div>
      </form>
    `;
  }

  getTemplate() {
    return `
      <div class="comment-header">
          <div class="comment-author">
            ${this.renderAuthorAvatar()}
            <div class="comment-author-ident">${this.renderAuthorLink()}</div>
          </div>
          <div class="comment-meta">
            <span class="comment-created">${this.comment.created_at ?? ""}</span>
            ${this.comment.created_at === this.comment.updated_at ? "" : this.comment.updated_at ? `<span class="comment-updated">Szerkesztve: ${this.comment.updated_at}</span>` : ""}
          </div>
      </div>
      <div class="comment-body">
          <div class="comment-content">${this.comment.content ?? ""}</div>
      </div>
      <div class="comment-actions">
        <comment-reactions controls="both"></comment-reactions>
      </div>
    `;
  }

  build() {
    if (this._built) return;

    this.update(true);

    this.addEventListener("inline-edit", this.onInlineEdit);
    this.addEventListener("reactions:click", this.onReactionsClick);

    this._built = true;
  }

  update(force = false) {
    if (!this.comment) return;

    const elements = this._elements;

    const loggedIn = isLoggedIn();
    const shouldPersonalize =
      loggedIn &&
      (window.VoidVanguard?.user?.id === this.comment.author_id ||
        (isAdmin() && this.admin));

    if (force || shouldPersonalize !== this._personalized) {
      this._changed.clear();
      this._editing = false;

      if (shouldPersonalize) {
        this.innerHTML = this.getPersonalizedTemplate();

        const form = this.querySelector("form");
        elements.form = form;

        const editableFields = form?.querySelectorAll(
          'input[name="content"], textarea[name="content"]',
        );
        editableFields?.forEach((field) => {
          field.removeEventListener("input", this.onFieldInput);
          field.addEventListener("input", this.onFieldInput);
        });

        const saveButton = this.querySelector("#save");
        saveButton.addEventListener?.("click", this.onSave);
        elements.saveButton = saveButton;

        const deleteButton = this.querySelector("#delete");
        deleteButton.addEventListener?.("click", this.onDelete);
        elements.deleteButton = deleteButton;
      } else {
        this.innerHTML = this.getTemplate();

        elements.saveButton = null;
        elements.deleteButton = null;
      }

      elements.commentReactions = this.querySelector("comment-reactions");
      elements.commentReactions.userReaction = this.comment.user_reaction_type;
      elements.commentReactions.likes = this.comment.likes ?? 0;
      elements.commentReactions.dislikes = this.comment.dislikes ?? 0;
      elements.commentReactions.readOnly = !loggedIn;

      this._personalized = shouldPersonalize;
    } else {
      elements.commentReactions.userReaction = this.comment.user_reaction_type;
      elements.commentReactions.likes = this.comment.likes ?? 0;
      elements.commentReactions.dislikes = this.comment.dislikes ?? 0;
      elements.commentReactions.readOnly = !loggedIn;
    }

    elements.commentReactions.hidden = false;
  }
}

window.customElements.define("comment-item", CommentItem);
