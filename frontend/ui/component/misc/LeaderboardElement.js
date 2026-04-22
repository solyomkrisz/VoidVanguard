import { on, off } from "/common/eventhub.js";
import { isLoggedIn, isInViewport } from "/common/common.js";
import * as net from "/common/network.js";
import LazyItemList from "/ui/component/data/LazyItemList.js";
import { el } from "/ui/UI.js";
import "/ui/component/misc/LeaderboardItem.js";

export default class LeaderboardElement extends LazyItemList {
  constructor() {
    super();

    this._elements = {};
    this._userItem = null;
    this._pinLocation = null;
    this._byUserId = new Map();

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onScroll = this.onScroll.bind(this);
  }

  onLogin(e) {
    this.customize();
  }

  onLogout() {
    this._userItem?.remove();
    this._userItem = null;
    this._pinLocation = null;
  }

  onScroll(e) {
    if (!this._userItem) return;

    const inListNode = this._byUserId.get(this._userItem?.data?.user_id);
    const visible = isInViewport(inListNode);

    if (visible) {
      this.unpinUser();
      return;
    }

    const rect = inListNode.getBoundingClientRect();

    if (rect.top < 0) {
      this.pinUser(inListNode, "top");
    } else {
      this.pinUser(inListNode, "bottom");
    }
  }

  unpinUser(originalNode) {
    this._userItem?.remove?.();
  }

  pinUser(originalNode, position) {
    this.unpinUser(originalNode);

    if (position === "top") {
      this._elements.topPinContainer?.appendChild(this._userItem);
    } else if (position === "bottom") {
      this._elements.bottomPinContainer?.appendChild(this._userItem);
    }
  }

  connectedCallback() {
    super.connectedCallback?.();

    this.customize();

    this._elements.topPinContainer = this.insertBefore(
      el("div", { class: "top-pin-container" }),
      this._container,
    );

    this._elements.bottomPinContainer = this.insertBefore(
      el("div", { class: "bottom-pin-container" }),
      this._container.nextSibling,
    );

    on("login", this.onLogin);
    on("logout", this.onLogout);

    window.addEventListener("scroll", this.onScroll);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this._elements.topPinContainer?.remove();
    this._elements.bottomPinContainer?.remove();

    off("login", this.onLogin);
    off("logout", this.onLogout);

    window.removeEventListener("scroll", this.onScroll);
  }

  async customize() {
    if (!isLoggedIn()) return;

    await this.createUserItem();

    if (!this._userItem) return;

    requestAnimationFrame(() => {
      this.onScroll();
    });
  }

  async getUserBestScoreWithRank() {
    const response = await net.send("/api/scores/");

    if (!response?.success || !response?.result) {
      return null;
    }

    return response.result;
  }

  async createUserItem() {
    const scoreData = await this.getUserBestScoreWithRank();
    if (!scoreData) return;

    const item = el("leaderboard-item");
    item.data = scoreData;
    item.id = "pinned";

    this._userItem = item;
  }

  renderItem(item) {
    const element = el("leaderboard-item");
    element.data = item;

    this._byUserId.set(item.user_id, element);

    return element;
  }

  extractItems(response) {
    return response?.result?.scores;
  }
}

window.customElements.define("leaderboard-element", LeaderboardElement);
