import { isLoggedIn, isAdmin } from "/common/common.js";
import * as net from "/common/network.js";

function requestToast(message, variant = "info", delay = 0, duration = 3000) {
  if (!message) return;

  document.dispatchEvent(
    new CustomEvent("toast-request", {
      detail: {
        toast: {
          message,
          variant,
          delay,
          duration,
        },
      },
    }),
  );
}

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
      <form class="comment-compose-form">
        <label class="comment-compose-label" for="profile-comment-input">Hozzászólás a profilhoz</label>
        <textarea id="profile-comment-input" name="content" placeholder="Írj egy hozzászólást ehhez a profilhoz..."></textarea>
        <button data-sfx="click_1" type="submit">Közzététel</button>
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
    const response = await net.send("/api/comments", {
      method: "POST",
      body: formData,
    });

    this.onResponse(response);
  }

  async onResponse(response) {
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

    requestToast(message || "Komment sikeresen közzétéve.", "success");

    this.querySelector(".comment-compose-form")?.reset();
  }
}

window.customElements.define("comment-form", CommentForm);
