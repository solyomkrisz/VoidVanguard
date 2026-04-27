import { el } from "/ui/UI.js";

export default class TokenListItem extends HTMLElement {
  set data(value) {
    this._data = value;
    this.update();
  }

  get data() {
    return this._data;
  }

  constructor() {
    super();

    this._data = null;
    this._elements = {};
    this._built = false;

    this.onSessionDestroyButtonClick =
      this.onSessionDestroyButtonClick.bind(this);
  }

  onSessionDestroyButtonClick(e) {
    if (!this.data?.id) return;

    this.dispatchEvent(
      new CustomEvent("session-destroy", {
        detail: { id: this.data.id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  connectedCallback() {
    this.build();
    this.update();
  }

  disconnectedCallback() {}

  build() {
    if (this._built) return;

    this._elements.isCurrentMarker = el("div", {
      class: "is-current-marker",
      hidden: true,
    });
    this._elements.id = el("div");
    this._elements.destroyButton = el(
      "button",
      {
        onClick: this.onSessionDestroyButtonClick,
      },
      ["Munkamenet felfüggesztése"],
    );
    this._elements.issuedAt = el("div");
    this._elements.expiresAt = el("div");

    this.append(
      this._elements.isCurrentMarker,
      this._elements.id,
      this._elements.issuedAt,
      this._elements.expiresAt,
      this._elements.destroyButton,
    );

    this._built = true;
  }

  update() {
    if (!this._built) return;

    this._elements.isCurrentMarker.hidden = !!this.data?.current;
    this._elements.id.textContent = this.data?.id;
    this._elements.issuedAt.textContent = this.data?.issued_at;
    this._elements.expiresAt.textContent = this.data?.expires_at;
  }
}

window.customElements.define("token-list-item", TokenListItem);
