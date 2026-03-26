import { isLoggedIn } from "/common/common.js";
import "/ui/component/form/InlineEditor.js";

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
    this._editedComment = {};
    this.changedProps = new Set();
    this._editing = false;
    this._personalized = null;
    this._built = false;

    this.onInlineEdit = this.onInlineEdit.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
  }

  onInlineEdit(e) {
    e.stopPropagation();
    console.log(e);

    const newValue = e.detail?.newValue;
    const propName = e.detail?.name;

    this._editedComment[propName] = newValue;

    if (!Object.is(this.comment[propName], newValue)) {
      this.changedProps.add(propName);
    } else {
      this.changedProps.delete(propName);
    }

    this.toggleEditing();
  }

  toggleEditing() {
    const button = this.querySelector("#save");
    if (!button) return;

    if (this.changedProps.size > 0 && !this._editing) {
      button.hidden = false;
      this._editing = true;
    } else if (this.changedProps.size === 0 && this._editing) {
      button.hidden = true;
      this._editing = false;
    }
  }

  onSave(e) {
    const form = this.querySelector("form");
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

  getPersonalizedTemplate() {
    return `
        <form>
            <div class="comment-header">
                <div>${this.comment.author ?? ""}</div>
                <div>${this.comment.created_at ?? ""}</div>
                <div>${this.comment.updated_at ?? ""}</div>
            </div>
            <div class="comment-body">
                <inline-editor name="content">
                    <div class="comment-content">${this.comment.content ?? ""}</div>
                    <textarea name="content"></textarea>
                </inline-editor>
            </div>
            <div class="comment-actions">
              <button id="save" type="button" hidden>Mentés</button>
            </div>
        </form>
    `;
  }

  getTemplate() {
    return `
        <div class="comment-header">
            <div>${this.comment.author ?? ""}</div>
            <div>${this.comment.created_at ?? ""}</div>
            <div>${this.comment.updated_at ?? ""}</div>
        </div>
        <div class="comment-body">
            <div class="comment-content">${this.comment.content ?? ""}</div>
        </div>
    `;
  }

  build() {
    this.update(true);
    this.addEventListener("inline-edit", this.onInlineEdit);
    this._built = true;
  }

  update(force = false) {
    if (!this.comment) return;

    const shouldPersonalize =
      isLoggedIn() && window.VoidVanguard?.user?.id === this.comment.author_id;

    if (force || shouldPersonalize !== this._personalized) {
      if (shouldPersonalize) {
        this.innerHTML = this.getPersonalizedTemplate();
        this.querySelector("#save").addEventListener?.("click", this.onSave);
      } else {
        this.innerHTML = this.getTemplate();
      }

      this._personalized = shouldPersonalize;
    }
  }
}

window.customElements.define("comment-item", CommentItem);
