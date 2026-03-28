export default class CommentReactions extends HTMLElement {
  static get observedAttributes() {
    return ["controls"];
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
  }

  constructor() {
    super();

    this._elements = {};
    this._built = false;
    this._userReaction = null;

    this.onReaction = this.onReaction.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "controls" && oldValue !== newValue) {
      this.updateDOM();
    }
  }

  onReaction(e) {
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
  }

  createButton(type) {
    const button = document.createElement("button");
    button.dataset.type = type;
    button.setAttribute("type", "button");
    button.textContent = type === "like" ? "Like" : "Dislike";
    button.addEventListener("click", this.onReaction);

    return button;
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
  }

  build() {
    const elements = this._elements;

    elements.likeButton = this.createButton("like");
    elements.dislikeButton = this.createButton("dislike");

    this._built = true;
  }
}

window.customElements.define("comment-reactions", CommentReactions);
