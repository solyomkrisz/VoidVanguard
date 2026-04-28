import { el } from "/ui/UI.js";

export default class UserBanListItem extends HTMLElement {
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
  }

  connectedCallback() {
    this.build();
    this.update();
  }

  disconnectedCallback() {}

  build() {
    if (this._built) return;

    this._elements = {
      reason: el("span"),
      createdAt: el("span"),
      expiresAt: el("span"),
      revokedAt: el("span"),
      createdBy: el("span"),
      revokedBy: el("span"),
    };

    this.append(
      this._elements.reason,
      this._elements.createdAt,
      this._elements.expiresAt,
      this._elements.revokedAt,
      this._elements.createdBy,
      this._elements.revokedBy,
    );

    this._built = true;
  }

  update() {
    if (!this._built || !this.data) return;

    this._elements.reason.textContent = this.data.reason ?? "-";
    this._elements.createdAt.textContent = this.data.created_at ?? "-";
    this._elements.expiresAt.textContent = this.data.expires_at ?? "-";
    this._elements.revokedAt.textContent = this.data.revoked_at ?? "-";
    this._elements.createdBy.textContent = this.data.created_by_name ?? "-";
    this._elements.revokedBy.textContent = this.data.revoked_by_name ?? "-";
  }
}

window.customElements.define("user-ban-list-item", UserBanListItem);
