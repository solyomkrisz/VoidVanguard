import { on, off } from "/common/eventhub.js";
import { isLoggedIn, isInViewport } from "/common/common.js";
import * as net from "/common/network.js";
import LazyItemList from "/ui/component/data/LazyItemList.js";
import { el } from "/ui/UI.js";
import "/ui/component/misc/LeaderboardItem.js";

export default class LeaderboardElement extends LazyItemList {
  get view() {
    return this.getAttribute("view");
  }

  constructor() {
    super();

    this._elements = {};
    this._userScoreData = null;
    this._userPinNode = null;
    this._byUserId = new Map();

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onScroll = this.onScroll.bind(this);
  }

  onLogin(e) {
    this.customize();
  }

  onLogout() {
    this.unpinUser();
    this._userScoreData = null;
  }

  onScroll(e) {
    if (!this._userScoreData) return;

    const originalNode = this.getOriginalNode();
    const visible = isInViewport(originalNode);

    if (visible) {
      this.unpinUser();
      return;
    }

    // ha nem látható és felfele van
    if (originalNode && originalNode.getBoundingClientRect().top < 0) {
      this.pinUser("top");
      // ha nem látható és nem felfele van (akkor is igaz ha szimplán még nem töltődött le, vagyis mindenképpen lentebb van)
    } else {
      this.pinUser("bottom");
    }
  }

  getOriginalNode() {
    return this._byUserId.get(this._userScoreData.user_id) || null;
  }

  unpinUser() {
    if (this._userScoreData) {
      const originalNode = this.getOriginalNode();

      if (originalNode) {
        originalNode.style.visibility = "visible";
      }
    }

    this._elements.topPinContainer.textContent = "";
    this._elements.bottomPinContainer.textContent = "";
  }

  pinUser(position) {
    // this.unpinUser(originalNode);
    const originalNode = this.getOriginalNode();
    originalNode && (originalNode.style.visibility = "hidden");

    if (!this._userPinNode) return;

    if (position === "top") {
      this._elements.topPinContainer.appendChild(this._userPinNode);
    } else if (position === "bottom") {
      this._elements.bottomPinContainer.appendChild(this._userPinNode);
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

    this._userScoreData = await this.getUserBestScoreWithRank();
    this.createUserPinNode();

    if (!this._userScoreData) return;

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

  createUserPinNode() {
    if (this._userScoreData) {
      this._userPinNode = this.renderItem(this._userScoreData, false);
      return;
    }
    this._userPinNode = null;
  }

  renderItem(item, addToMap = true) {
    const element = el("leaderboard-item");
    element.data = item;

    if (addToMap) {
      this._byUserId.set(item.user_id, element);
    }

    return element;
  }

  extractItems(response) {
    return response?.result?.scores;
  }

  getURL() {
    const url = new URL(this.src, window.location.origin);
    url.searchParams.set("view", this.view);
    return url;
  }
}

window.customElements.define("leaderboard-element", LeaderboardElement);
