import { el } from "/ui/UI.js";

export default class LeaderboardItem extends HTMLElement {
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

  build() {
    if (this._built) return;

    this._elements.score = this.appendChild(el("div"));
    this._elements.userId = this.appendChild(el("div"));

    this._built = true;
  }

  update() {
    if (!this._built) return;

    this._elements.userId.textContent = `User ID: ${this.data?.user_id}`;
    this._elements.score.textContent = `Best Score: ${this.data?.best_score}`;
  }
}

window.customElements.define("leaderboard-item", LeaderboardItem);
