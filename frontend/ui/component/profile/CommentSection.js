import LazyItemList from "/ui/component/data/LazyItemList.js";

export default class CommentSection extends LazyItemList {
  constructor() {
    super();
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
