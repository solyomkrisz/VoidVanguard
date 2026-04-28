import LazyItemList from "/ui/component/data/LazyItemList.js";
import { importWithRefresh } from "/common/network.js";
await importWithRefresh("/protected/ui/component/data/UserBanListItem.js");

export default class UserBanList extends LazyItemList {
  static get observedAttributes() {
    return ["user-id"];
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
        this.setAttribute("src", `/api/admin/bans?targetUserId=${newValue}`);
        this.refresh();
      } else {
        this.reset();
      }
    }
  }

  renderItem(item) {
    const el = document.createElement("user-ban-list-item");
    el.data = item;
    return el;
  }

  extractItems(response) {
    return response?.result?.bans || [];
  }
}

window.customElements.define("user-ban-list", UserBanList);
