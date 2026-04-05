import LazyItemList from "/ui/component/data/LazyItemList.js";

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

    if (name === "user-id" && oldValue !== newValue && newValue) {
      this.setAttribute("src", `/api/blocks?targetId=${newValue}`);
      this.refresh();
    }
  }

  connectedCallback() {
    super.connectedCallback?.();
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
