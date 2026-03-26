import LazyItemList from "/ui/component/data/LazyItemList.js";
import { on, off } from "/common/eventhub.js";
import * as net from "/common/network.js";
import "/ui/component/form/InlineEditor.js";
import "/ui/component/profile/CommentItem.js";

export default class CommentSection extends LazyItemList {
  constructor() {
    super();

    this._built = false;
    this._byId = new Map();
    this._byAuthor = new Map();

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onCommentPost = this.onCommentPost.bind(this);
    this.onCommentUpdate = this.onCommentUpdate.bind(this);
  }

  connectedCallback() {
    // super.connectedCallback?.();

    if (this._built) return;
    this.build();

    this.addEventListener("comment-post", this.onCommentPost);
    this.addEventListener("comment-update", this.onCommentUpdate);
    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    super.diconnectedCallback?.();

    this.removeEventListener("comment-post", this.onCommentPost);
    this.removeEventListener("comment-update", this.onCommentUpdate);
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  onLogin(e) {
    const newId = e.detail?.newId;
    const oldId = e.detail?.oldId;

    {
      const entries = this._byAuthor.get(oldId);

      if (entries) {
        for (const entry of entries) {
          entry.element.update();
        }
      }
    }

    {
      const entries = this._byAuthor.get(newId);

      if (entries) {
        for (const entry of entries) {
          entry.element.update();
        }
      }
    }
  }

  onLogout(e) {
    const id = e.detail?.oldId;

    const entries = this._byAuthor.get(id);

    if (!entries) return;

    for (const entry of entries) {
      entry.element.update();
    }
  }

  onCommentPost(e) {
    this.refresh();
  }

  async onCommentUpdate(e) {
    const commentId = e.detail?.commentId;
    const formData = e.detail?.formData;

    if (!commentId || !formData || !(formData instanceof FormData)) {
      return;
    }

    formData.append("commentId", commentId);

    const response = await net.send("/api/comments", {
      method: "PATCH",
      body: formData,
    });

    const { success, result } = response;

    console.log(response);

    if (!success) {
      console.error("Failed to update comment.");
      return;
    }

    e.target.comment = result;
  }

  extractItems(response) {
    return response?.result?.comments;
  }

  extractHasNext(response) {
    return response?.result?.hasNext;
  }

  categorizeItemBy(id, map, entry) {
    if (!map || !id || !entry) return;

    if (!map.has(id)) {
      map.set(id, []);
    }

    map.get(id).push(entry);
  }

  renderItem(comment) {
    const element = document.createElement("comment-item");
    element.comment = comment;

    const entry = {
      comment,
      element,
    };

    this.categorizeItemBy(comment.id, this._byId, entry);
    this.categorizeItemBy(comment.author_id, this._byAuthor, entry);

    return element;
  }
}

window.customElements.define("comment-section", CommentSection);
