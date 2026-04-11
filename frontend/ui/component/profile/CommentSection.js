import LazyItemList from "/ui/component/data/LazyItemList.js";
import { on, off } from "/common/eventhub.js";
import { isLoggedIn, isAdmin } from "/common/common.js";
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

  get admin() {
    return this.hasAttribute("admin");
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

  removeFromMaps(comment) {
    const commentId = comment?.id;
    const authorId = comment?.author_id;

    if (!commentId || !authorId) return;

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

  onNodeDeletion(node) {
    this.removeFromMaps(node.comment);
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
    this.changeCommentFormVisibility();
  }

  onLogout(e) {
    this.changeCommentFormVisibility();
  }

  async onCommentReaction(e) {
    e.stopPropagation();

    const commentId = e.detail?.commentId;
    const type = e.detail?.type;
    if (!commentId || !type) return;

    const formData = new FormData();
    formData.append("targetId", commentId);
    formData.append("type", type);

    /** admin */
    if (this.admin && isAdmin()) {
      const targetUserId =
        this.closest("admin-module")?.getAttribute("target-user-id");

      if (targetUserId) {
        formData.append("targetUserId", targetUserId);
      }
    }

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
    let url = "/api/comments/" + commentId;

    /** admin */
    if (this.admin && isAdmin()) {
      const targetUserId =
        this.closest("admin-module")?.getAttribute("target-user-id");

      if (targetUserId) {
        url += "?targetUserId=" + targetUserId;
      }
    }

    response = await net.send(url);

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

    const comment = e.detail?.comment;

    const commentId = comment?.id;
    if (!commentId) return;

    const authorId = comment?.author_id;
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

    if (this.controls === "pagination") {
      this.reloadCurrentPage();
    }

    this.removeFromMaps(comment);
  }

  async onCommentUpdate(e) {
    e.stopPropagation();

    const commentId = e.detail?.commentId;
    const formData = e.detail?.formData;

    if (!commentId || !formData || !(formData instanceof FormData)) {
      return;
    }

    formData.append("commentId", commentId);

    /** admin */
    if (this.admin && isAdmin()) {
      const { comment } = this._byId.get(commentId);
      const authorId = comment.author_id;

      if (authorId) {
        formData.append("targetUserId", authorId);
      }
    }

    const response = await net.send("/api/comments", {
      method: "PATCH",
      body: formData,
    });

    const { success, result } = response;

    if (!success) {
      console.error("Failed to update comment.");
      return;
    }

    e.target.comment = result; // Lehet később külön kéne lekérni az updatelt kommentet.
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

    /** admin */
    if (this.admin) {
      element.setAttribute("admin", "");
    }

    element.comment = comment;

    const entry = {
      comment,
      element,
    };

    this._byId.set(comment.id, entry);
    this.categorizeItemBy(comment.author_id, this._byAuthor, entry, Set, _add);

    return element;
  }

  getURL() {
    const url = new URL(this.src, window.location.origin);

    const targetUserId =
      this.closest("admin-module")?.getAttribute("target-user-id");

    if (targetUserId && this.admin && isAdmin()) {
      url.searchParams.set("targetUserId", targetUserId);
    }

    return url;
  }
}

window.customElements.define("comment-section", CommentSection);
