import LazyItemList from "/ui/component/data/LazyItemList.js";

export default class CommentSection extends LazyItemList {
  constructor() {
    super();

    this._built = false;
    this.onCommentPost = this.onCommentPost.bind(this);
  }

  connectedCallback() {
    // super.connectedCallback?.();

    if (this._built) return;
    this.build();
    this.addEventListener("comment-post", this.onCommentPost);
  }

  diconnectedCallback() {
    super.diconnectedCallback?.();
    this.removeEventListener("comment-post", this.onCommentPost);
  }

  onCommentPost(e) {
    this.refresh();
  }

  extractItems(response) {
    return response?.result?.comments;
  }

  extractHasNext(response) {
    return response?.result?.hasNext;
  }

  renderItem(comment) {
    const el = document.createElement("div");
    el.className = "comment";

    el.innerHTML = `
        <div class="comment-header">
            <div>${comment.author ?? ""}</div>
            <div>${comment.created_at ?? ""}</div>
        </div>
        <div class="comment-body">
            ${comment.content ?? ""}
        </div>
    `;

    return el;
  }
}

window.customElements.define("comment-section", CommentSection);
