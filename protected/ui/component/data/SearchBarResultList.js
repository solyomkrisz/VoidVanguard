import LazyItemList from "/ui/component/data/LazyItemList.js";
import "/protected/ui/component/data/SearchBarResultItem.js";

class SearchBarResultList extends LazyItemList {
  static get observedAttributes() {
    return [...super.observedAttributes, "target-user-id"];
  }

  get useEvent() {
    return this.hasAttribute("use-event");
  }

  constructor() {
    super();

    this._items = new Set();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback?.(name, oldValue, newValue);

    if (name === "target-user-id" && oldValue !== newValue) {
      this.updatePersonalizations();
    }
  }

  updatePersonalizations() {
    for (const element of this._items) {
      element.syncRelationshipButtons?.();
    }
  }

  renderItem(item) {
    const el = document.createElement("search-bar-result-item");

    el.data = item;
    if (this.useEvent) {
      el.setAttribute("use-event", "");
    }

    this._items.add(el);

    return el;
  }

  extractItems(response) {
    return response?.result?.results;
  }
}

window.customElements.define("search-bar-result-list", SearchBarResultList);
