import { isLoggedIn, isAdmin } from "/common/common.js";
import * as net from "/common/network.js";

export default class CommentForm extends HTMLElement {
  set targetId(value) {
    this.setAttribute("target-id", value);
  }

  get targetId() {
    return this.getAttribute("target-id");
  }

  get admin() {
    return this.hasAttribute("admin");
  }

  constructor() {
    super();

    this._pending = false;
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
    this._elements.form = form;
  }

  async onSubmit(e) {
    e.preventDefault();

    if (this._pending) return;

    if (!isLoggedIn()) {
      return;
    }

    const form = e.currentTarget;

    const formData = new FormData(form);
    // formData.append("authorId", window.VoidVanguard.user.id);
    formData.append("targetId", this.targetId);

    /** admin */
    if (this.admin && isAdmin()) {
      this.dispatchEvent(
        new CustomEvent("sign-request", {
          detail: { formData },
          bubbles: true,
          composed: true,
        }),
      );

      return;
    }

    this.sendRequest(formData);
  }

  /** Needed to be compatible with <admin-module> */
  onSignSuccess(data) {
    this.sendRequest(data.formData);
  }

  /** Needed to be compatible with <admin-module> */
  onSignError(data) {
    this.sendRequest(data.formData);
  }

  async sendRequest(formData) {
    this._pending = true;

    const response = await net.send("/api/comments", {
      method: "POST",
      body: formData,
    });

    this.onResponse(response);
  }

  async onResponse(response) {
    this._pending = false;

    const { success, result, message } = response;

    if (!success || !result) {
      console.log(result, message);
      console.error("An error occured during posting your comment.");
      return;
    }

    this._elements.form?.reset?.();

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
