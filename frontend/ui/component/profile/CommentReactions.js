export default class CommentReactions extends HTMLElement {
  static get observedAttributes() {
    return ["controls", "readonly", "likes", "dislikes"];
  }

  set controls(value) {
    if (!["like", "dislike", "both"].includes(value)) {
      return false;
    }

    this.setAttribute("controls", value);
    return true;
  }

  get controls() {
    return this.getAttribute("controls");
  }

  set userReaction(value) {
    const oldValue = this._userReaction;
    if (oldValue === value) return;
    this._userReaction = value;
    this.onUserReactionChange();
  }

  get userReaction() {
    return this._userReaction;
  }

  set readOnly(value) {
    if (value) {
      this.setAttribute("readonly", "");
    } else {
      this.removeAttribute("readonly");
    }
  }

  get readOnly() {
    return this.hasAttribute("readonly");
  }

  set likes(value) {
    this._likes = Number.isFinite(Number(value)) ? Number(value) : 0;
    this.onCountsChange();
  }

  get likes() {
    return this._likes;
  }

  set dislikes(value) {
    this._dislikes = Number.isFinite(Number(value)) ? Number(value) : 0;
    this.onCountsChange();
  }

  get dislikes() {
    return this._dislikes;
  }

  constructor() {
    super();

    this._elements = {};
    this._built = false;
    this._userReaction = null;
    this._likes = 0;
    this._dislikes = 0;

    this.onReaction = this.onReaction.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "controls" && oldValue !== newValue) {
      this.updateDOM();
      return;
    }

    if (name === "readonly" && oldValue !== newValue) {
      this.onReadOnlyChange();
      return;
    }

    if (name === "likes" && oldValue !== newValue) {
      this.likes = newValue;
      return;
    }

    if (name === "dislikes" && oldValue !== newValue) {
      this.dislikes = newValue;
    }
  }

  onReaction(e) {
    if (this.readOnly) return;

    const type = e.currentTarget.dataset.type;

    this.dispatchEvent(
      new CustomEvent("reactions:click", {
        detail: { type },
        bubbles: true,
        composed: true,
      }),
    );
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
    this.updateDOM();
    this.onUserReactionChange();
    this.onCountsChange();
    this.onReadOnlyChange();
  }

  createButton(type) {
    const button = document.createElement("button");
    button.dataset.type = type;
    button.setAttribute("type", "button");

    const label = document.createElement("span");
    label.className = "reaction-label";
    label.textContent = type === "like" ? "Like" : "Dislike";

    const count = document.createElement("span");
    count.className = "reaction-count";
    count.textContent = "0";

    button.append(label, count);
    button.addEventListener("click", this.onReaction);

    return button;
  }

  onCountsChange() {
    const { likeButton, dislikeButton } = this._elements;

    if (likeButton) {
      const count = likeButton.querySelector(".reaction-count");
      if (count) count.textContent = String(this.likes);
    }

    if (dislikeButton) {
      const count = dislikeButton.querySelector(".reaction-count");
      if (count) count.textContent = String(this.dislikes);
    }
  }

  onReadOnlyChange() {
    const { likeButton, dislikeButton } = this._elements;
    if (!likeButton || !dislikeButton) return;

    likeButton.disabled = this.readOnly;
    dislikeButton.disabled = this.readOnly;
  }

  onUserReactionChange() {
    const { likeButton, dislikeButton } = this._elements;
    if (!likeButton || !dislikeButton) return;

    likeButton.classList.toggle("active", this.userReaction === "like");
    dislikeButton.classList.toggle("active", this.userReaction === "dislike");
  }

  updateDOM() {
    if (!this._built) return;

    const elements = this._elements;

    if (this.controls === "like") {
      if (!elements.likeButton.isConnected) {
        this.appendChild(elements.likeButton);
      }
      elements.dislikeButton?.remove();

      return;
    }

    if (this.controls === "dislike") {
      if (!elements.dislikeButton.isConnected) {
        this.appendChild(elements.dislikeButton);
      }
      elements.likeButton?.remove();

      return;
    }

    if (this.controls === "both") {
      if (!elements.likeButton.isConnected) {
        this.appendChild(elements.likeButton);
      }
      if (!elements.dislikeButton.isConnected) {
        this.appendChild(elements.dislikeButton);
      }
    }

    this.onCountsChange();
    this.onReadOnlyChange();
  }

  build() {
    const elements = this._elements;

    elements.likeButton = this.createButton("like");
    elements.dislikeButton = this.createButton("dislike");

    this._built = true;
  }
}

window.customElements.define("comment-reactions", CommentReactions);
