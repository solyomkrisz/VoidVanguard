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
    this._userScoreData = null;
    this._byUserId = new Map();

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onScroll = this.onScroll.bind(this);
  }

  onLogin(e) {
    this.customize();
  }

  onLogout() {
    this.unpinUser(this._byUserId.get(this._userScoreData?.user_id));
    this._userScoreData = null;
  }

  onScroll(e) {
    if (!this._userScoreData) return;

    const node = this._byUserId.get(this._userScoreData?.user_id);
    const visible = isInViewport(node);

    if (visible) {
      this.unpinUser(node);
      return;
    }

    // ha nem látható és felfele van
    if (node.getBoundingClientRect().top < 0) {
      this.pinUser(node, "top");
      // ha nem látható és nem felfele van (akkor is igaz ha szimplán még nem töltődött le)
    } else {
      this.pinUser(node, "bottom");
    }
  }

  unpinUser(node) {
    node.style.visibility = "visible";
    this._elements.topPinContainer.textContent = "";
    this._elements.bottomPinContainer.textContent = "";
  }

  pinUser(node, position) {
    // this.unpinUser(originalNode);
    node.style.visibility = "hidden";

    if (position === "top") {
      this._elements.topPinContainer.innerHTML = node.innerHTML;
    } else if (position === "bottom") {
      this._elements.bottomPinContainer.innerHTML = node.innerHTML;
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
