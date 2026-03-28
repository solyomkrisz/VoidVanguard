import { isLoggedIn } from "/common/common.js";
import * as net from "/common/network.js";

export default class CommentForm extends HTMLElement {
  set targetId(value) {
    this.setAttribute("target-id", value);
  }

  get targetId() {
    return this.getAttribute("target-id");
  }

  constructor() {
    super();

    this._elements = {};
    this._built = false;
    this.onSubmit = this.onSubmit.bind(this);
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
  }

  build() {
    this.innerHTML = `
        <form>
            <textarea name="content"></textarea>
            <button>Közzététel</button>
        </form>
    `;

    const form = this.querySelector("form");
    form.addEventListener("submit", this.onSubmit);
  }

  async onSubmit(e) {
    e.preventDefault();

    if (!isLoggedIn()) {
      return;
    }

    const form = e.currentTarget;

    const formData = new FormData(form);
    formData.append("authorId", window.VoidVanguard.user.id);
    formData.append("targetId", this.targetId);

    const response = await net.send("/api/comments", {
      method: "POST",
      body: formData,
    });

    const { success, result, message } = response;

    if (!success || !result) {
      console.log(result, message);
      console.error("An error occured during posting your comment.");
      return;
    }

    this.dispatchEvent(
      new CustomEvent("comment-post", {
        detail: {
          comment: result,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

window.customElements.define("comment-form", CommentForm);
