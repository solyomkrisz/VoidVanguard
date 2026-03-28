import { isLoggedIn } from "/common/common.js";
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

  constructor() {
    super();

    this._comment = null;
    this._changed = new Set();
    this._editing = false;
    this._personalized = null;
    this._built = false;
    this._elements = {};

    this.onInlineEdit = this.onInlineEdit.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onReactionsClick = this.onReactionsClick.bind(this);
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
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

  getPersonalizedTemplate() {
    return `
      <form>
          <div class="comment-header">
              <div>${this.comment.author ?? ""}</div>
              <div>${this.comment.created_at ?? ""}</div>
              ${this.comment.created_at === this.comment.updated_at ? "" : this.comment.updated_at ? `<div>${this.comment.updated_at}</div>` : ""}
          </div>
          <div class="comment-body">
              <inline-editor>
                  <dashed-border-box>
                    <div data-text class="comment-content editable">${(this.comment.content ?? "").trim()}</div>
                  </dashed-border-box>
                  <textarea data-editor name="content"></textarea>
              </inline-editor>
          </div>
          <div class="comment-footer">
            <div>
              <span>Likeok: <span>${this.comment.likes}</span></span>
              <br />
              <span>Dislikeok: <span>${this.comment.dislikes}</span></span>
            </div>
          </div>
          <div class="comment-actions">
            <comment-reactions controls="both"></comment-reactions>
            <button id="save" type="button" hidden>Mentés</button>
            <button id="delete" type="button">Törlés</button>
          </div>
      </form>
    `;
  }

  getTemplate() {
    console.log(this.comment);
    return `
      <div class="comment-header">
          <div>${this.comment.author ?? ""}</div>
          <div>${this.comment.created_at ?? ""}</div>
          ${this.comment.created_at === this.comment.updated_at ? "" : this.comment.updated_at ? `<div>${this.comment.updated_at}</div>` : ""}
      </div>
      <div class="comment-body">
          <div class="comment-content">${this.comment.content ?? ""}</div>
      </div>
      <div class="comment-footer">
        <div>
          <span>Likeok: <span>${this.comment.likes}</span></span>
          <br />
          <span>Dislikeok: <span>${this.comment.dislikes}</span></span>
        </div>
      </div>
      <div class="comment-actions">
        <comment-reactions controls="both"></comment-reactions>
      </div>
    `;
  }

  build() {
    this.update(true);

    this.addEventListener("inline-edit", this.onInlineEdit);
    this.addEventListener("reactions:click", this.onReactionsClick);

    this._built = true;
  }

  update(force = false) {
    if (!this.comment) return;

    const elements = this._elements;

    const shouldPersonalize =
      isLoggedIn() && window.VoidVanguard?.user?.id === this.comment.author_id;

    if (force || shouldPersonalize !== this._personalized) {
      if (shouldPersonalize) {
        this.innerHTML = this.getPersonalizedTemplate();

        const form = this.querySelector("form");
        elements.form = form;

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

      this._personalized = shouldPersonalize;
    }
  }
}

window.customElements.define("comment-item", CommentItem);
