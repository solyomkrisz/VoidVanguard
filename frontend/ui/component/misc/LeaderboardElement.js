import { on, off } from "/common/eventhub.js";
import { isLoggedIn, isInViewport } from "/common/common.js";
import * as net from "/common/network.js";
import LazyItemList from "/ui/component/data/LazyItemList.js";
import { el } from "/ui/UI.js";
import "/ui/component/misc/LeaderboardItem.js";
import NetworkErrorHandler from "/common/NetworkErrorHandler.js";

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
    this._rankOffset = 0;

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
    this._rankOffset = 0;
  }

  onScroll(e) {
    if (!this._userScoreData) return;

    const originalNode = this.getOriginalNode();
    const visible = isInViewport(originalNode);

    if (visible) {
      this.unpinUser();
      return;
    }

    this.pinUser("bottom");
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
    this._userPinNode?.remove();
  }

  pinUser(position) {
    const originalNode = this.getOriginalNode();
    originalNode && (originalNode.style.visibility = "hidden");

    if (!this._userPinNode) return;

    const target =
      position === "top"
        ? this._elements.topPinContainer
        : this._elements.bottomPinContainer;

    if (this._userPinNode.parentNode !== target) {
      target.appendChild(this._userPinNode);
    }
  }

  connectedCallback() {
    super.connectedCallback?.();

    this.customize();

    // Column header
    this._elements.header = this.insertBefore(
      el("div", { class: "lb-header" }, [
        el("div", { class: "lb-header-rank" }, ["Helyezés"]),
        el("div", { class: "lb-header-name" }, ["Játékos"]),
        el("div", { class: "lb-header-score" }, ["Pont"]),
      ]),
      this._container,
    );

    this._elements.topPinContainer = document.body.appendChild(
      el("div", { class: "top-pin-container" }),
    );

    this._elements.bottomPinContainer = document.body.appendChild(
      el("div", { class: "bottom-pin-container" }),
    );

    on("login", this.onLogin);
    on("logout", this.onLogout);

    window.addEventListener("scroll", this.onScroll);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    // Cancel any in-flight load so a discarded element can never write results
    this._activeLoadToken = null;

    this._elements.header?.remove();
    this._elements.topPinContainer?.remove();
    this._elements.bottomPinContainer?.remove();

    off("login", this.onLogin);
    off("logout", this.onLogout);

    window.removeEventListener("scroll", this.onScroll);
  }

  renderContent(items, response) {
    if (!Array.isArray(items)) return;

    const hadCurrentUser =
      this._userScoreData != null &&
      this._byUserId.has(this._userScoreData.user_id);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (this._byUserId.has(item.user_id)) continue;

      const rank = this._rankOffset + i + 1;
      const node = this.renderItem({ ...item, rank }, true);

      if (node) {
        this.save(node);
        this._container.appendChild(node);
      }
    }

    this._rankOffset += items.length;

    // Once the current user's row lands in the list, sync pin/inline visibility
    if (
      !hadCurrentUser &&
      this._userScoreData != null &&
      this._byUserId.has(this._userScoreData.user_id)
    ) {
      requestAnimationFrame(() => this.onScroll());
    }
  }

  async customize() {
    if (!isLoggedIn()) return;

    this._userScoreData = await this.getUserBestScoreWithRank();
    this.createUserPinNode();

    if (!this._userScoreData) return;

    requestAnimationFrame(() => this.onScroll());
  }

  async getUserBestScoreWithRank() {
    const response = await net.send("/api/scores/");

    if (
      NetworkErrorHandler.handle(response, {
        strict: true,
        context: "LeaderboardElement.getUserBestScoreWithRank",
      })
    ) {
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

  onLoadFinish() {
    super.onLoadFinish?.();
    this.toggleAttribute("data-all-loaded", !this._hasNext);
  }

  reset() {
    this._rankOffset = 0;
    this._byUserId.clear();
    this.removeAttribute("data-all-loaded");
    super.reset();
  }

  getURL() {
    const url = new URL(this.src, window.location.origin);
    url.searchParams.set("view", this.view);
    return url;
  }
}

window.customElements.define("leaderboard-element", LeaderboardElement);
