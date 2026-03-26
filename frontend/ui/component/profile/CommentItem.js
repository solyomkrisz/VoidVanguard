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
    this._personalized = null;
    this._built = false;
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
  }

  getPersonalizedTemplate() {
    return `
        <form>
            <div class="comment-header">
                <div>${this.comment.author ?? ""}</div>
                <div>${this.comment.created_at ?? ""}</div>
            </div>
            <div class="comment-body">
                <inline-editor>
                    <div>${this.comment.content ?? ""}</div>
                    <textarea></textarea>
                </inline-editor>
            </div>
        </form>
    `;
  }

  getTemplate() {
    return `
        <div class="comment-header">
            <div>${this.comment.author ?? ""}</div>
            <div>${this.comment.created_at ?? ""}</div>
        </div>
        <div class="comment-body">
            <div>${this.comment.content ?? ""}</div>
        </div>
    `;
  }

  build() {
    this.update(true);
    this._built = true;
  }

  update(force = false) {
    if (!this.comment) return;

    const shouldPersonalize =
      isLoggedIn() && window.VoidVanguard?.user?.id === this.comment.author_id;

    if (force || shouldPersonalize !== this._personalized) {
      if (shouldPersonalize) {
        this.innerHTML = this.getPersonalizedTemplate();
      } else {
        this.innerHTML = this.getTemplate();
      }

      this._personalized = shouldPersonalize;
    }
  }
}

window.customElements.define("comment-item", CommentItem);
