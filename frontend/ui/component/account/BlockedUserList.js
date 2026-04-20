import LazyItemList from "/ui/component/data/LazyItemList.js";
import { isLoggedIn, isUserSet } from "/common/common.js";

export default class BlockedUserList extends LazyItemList {
  static get observedAttributes() {
    return ["user-id"];
  }

  get userId() {
    return this.getAttribute("user-id");
  }

  constructor() {
    super();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // super.attributeChangedCallback?.(name, oldValue, newValue);

    if (!this._built) {
      this._deferredAttributes.set(name, newValue);
      return;
    }

    if (name === "user-id" && oldValue !== newValue) {
      console.warn(
        `${name} changed from [${oldValue}] to [${newValue}] when this._built was`,
        this._built,
      );

      if (newValue) {
        this.setAttribute("src", `/api/blocks?targetId=${newValue}`);
        this.refresh();
      } else {
        this.reset();
      }
    }
  }

  connectedCallback() {
    super.connectedCallback?.();

    if (isLoggedIn() && isUserSet() && this.hasAttribute("auto")) {
      this.setAttribute("user-id", window.VoidVanguard.user.id);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
  }

  renderItem(item) {
    const el = document.createElement("div");

    el.innerHTML = `
        <span>${item.name}</span>
    `;

    return el;
  }

  extractItems(response) {
    return response?.result?.blocks || [];
  }
}

window.customElements.define("blocked-user-list", BlockedUserList);
