/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/misc/LeaderboardItem.js
 * Szerep: Egyetlen leaderboard sor kirajzolasa helyezessel, eremmel es profil linkkel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { el } from "/ui/UI.js";

const MEDALS = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];

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

    this._elements.rank  = this.appendChild(el("div", { class: "lb-rank" }));
    this._elements.name  = this.appendChild(el("div", { class: "lb-name" }));
    this._elements.score = this.appendChild(el("div", { class: "lb-score" }));

    this._built = true;
  }

  update() {
    if (!this._built) return;

    const rank = this.data?.rank;
    const medal = rank >= 1 && rank <= 3 ? MEDALS[rank - 1] : null;

    // Az elso harom helyet kulon eremmel emeljuk ki, a tobbi csak sorszammal jelenik meg.
    if (medal) {
      this._elements.rank.innerHTML =
        `<span class="lb-medal">${medal}</span><span class="lb-rank-num">#${rank}</span>`;
    } else {
      this._elements.rank.textContent = rank ? "#" + rank : "";
    }

    this._elements.name.textContent = "";
    const username = this.data?.name;
    if (username && this.data?.user_id) {
      const link = document.createElement("a");
      link.href = `/profile/${this.data.user_id}`;
      link.textContent = username;
      link.className = "lb-name-link";
      this._elements.name.appendChild(link);
    } else {
      this._elements.name.textContent = username ?? "\u2014";
    }
    this._elements.score.textContent = this.data?.best_score != null
      ? this.data.best_score.toLocaleString() + " pt"
      : "\u2014";

    this.dataset.rank = rank ?? "";
  }
}

window.customElements.define("leaderboard-item", LeaderboardItem);
