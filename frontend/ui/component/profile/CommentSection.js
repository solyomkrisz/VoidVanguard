import LazyItemList from "/ui/component/data/LazyItemList.js";
import { on, off } from "/common/eventhub.js";
import { isLoggedIn } from "/common/common.js";
import * as net from "/common/network.js";
import "/ui/component/form/InlineEditor.js";
import "/ui/component/profile/CommentItem.js";

function _push(array, item) {
  array.push(item);
}

function _add(set, item) {
  set.add(item);
}

export default class CommentSection extends LazyItemList {
  static get observedAttributes() {
    return [...super.observedAttributes, "can-comment"];
  }

  get canComment() {
    return this.hasAttribute("can-comment");
  }

  constructor() {
    super();

    this._built = false;
    this._byId = new Map();
    this._byAuthor = new Map();

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onCommentPost = this.onCommentPost.bind(this);
    this.onCommentUpdate = this.onCommentUpdate.bind(this);
    this.onCommentDelete = this.onCommentDelete.bind(this);
    this.onCommentReaction = this.onCommentReaction.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback?.(name, oldValue, newValue);

    if (name === "can-comment") {
      this.changeCommentFormVisibility();
    }
  }

  changeCommentFormVisibility() {
    const commentForm = this.querySelector("comment-form");
    if (!commentForm) return;

    if (this.canComment && isLoggedIn()) {
      commentForm.hidden = false;
    } else {
      commentForm.hidden = true;
    }
  }

  connectedCallback() {
    // super.connectedCallback?.();

    if (this._built) return;
    this.build();
    this.changeCommentFormVisibility();

    this.addEventListener("comment-post", this.onCommentPost);
    this.addEventListener("comment-update", this.onCommentUpdate);
    this.addEventListener("comment-delete", this.onCommentDelete);
    this.addEventListener("comment-reaction", this.onCommentReaction);

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this.removeEventListener("comment-post", this.onCommentPost);
    this.removeEventListener("comment-update", this.onCommentUpdate);
    this.removeEventListener("comment-delete", this.onCommentDelete);
    this.addEventListener("comment-reaction", this.onCommentReaction);

    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  onLogin(e) {
    const commentForm = this.querySelector("comment-form");
    if (commentForm) {
      commentForm.hidden = false;
    }
  }

  onLogout(e) {
    const commentForm = this.querySelector("comment-form");
    if (commentForm) {
      commentForm.hidden = true;
    }
  }

  async onCommentReaction(e) {
    e.stopPropagation();

    const commentId = e.detail?.commentId;
    const type = e.detail?.type;
    if (!commentId || !type) return;

    const formData = new FormData();
    formData.append("targetId", commentId);
    formData.append("type", type);

    let response = await net.send("/api/reactions", {
      method: "POST",
      body: formData,
    });

    let { success, result } = response;

    if (!success) {
      console.log("Unable to send reaction.");
      return;
    }

    // refresh comment
    response = await net.send("/api/comments/" + commentId);

    ({ success, result } = response);

    if (!success) {
      console.error("Unable to refresh comment.");
      return;
    }

    e.target.comment = result;
  }

  onCommentPost(e) {
    e.stopPropagation();

    const comment = e.detail?.comment;

    // comes from superclass
    if (!this._container || !comment || this.controls === "pagination") {
      this._byId.clear();
      this._byAuthor.clear();

      this.refresh();

      return;
    }

    const commentItem = this.renderItem(comment);
    this._container.prepend(commentItem);
  }

  async onCommentDelete(e) {
    e.stopPropagation();

    const commentId = e.detail?.comment?.id;
    if (!commentId) return;

    const authorId = e.detail?.comment?.author_id;
    if (!authorId) return;

    const formData = new FormData();
    formData.append("commentId", commentId);

    const response = await net.send("/api/comments", {
      method: "DELETE",
      body: formData,
    });

    const { success, result } = response;

    if (!success) {
      console.error("Failed to delete comment.");
      return;
    }

    e.target.remove();

    const entry = this._byId.get(commentId);
    if (!entry) return;

    const authorSet = this._byAuthor.get(authorId);
    if (authorSet) {
      authorSet.delete(entry);
      if (authorSet.size === 0) {
        this._byAuthor.delete(authorId);
      }
    }

    this._byId.delete(commentId);
  }

  async onCommentUpdate(e) {
    e.stopPropagation();

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

  categorizeItemBy(id, map, entry, Collection = Array, add = _push) {
    if (!map || !id || !entry) return;

    if (!map.has(id)) {
      map.set(id, new Collection());
    }

    add(map.get(id), entry);
  }

  renderItem(comment) {
    const element = document.createElement("comment-item");
    element.comment = comment;

    const entry = {
      comment,
      element,
    };

    this._byId.set(comment.id, entry);
    this.categorizeItemBy(comment.author_id, this._byAuthor, entry, Set, _add);

    return element;
  }
}

window.customElements.define("comment-section", CommentSection);
