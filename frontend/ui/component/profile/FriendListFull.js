import LazyItemList from "/ui/component/data/LazyItemList.js";

export default class FriendListFull extends LazyItemList {
  static get observedAttributes() {
    return [...super.observedAttributes, "user-id"];
  }

  constructor() {
    super();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback?.(name, oldValue, newValue);

    if (name === "user-id" && oldValue !== newValue) {
      this.setAttribute("src", "/api/friends?targetId=" + newValue);
    }
  }

  renderItem(item) {
    const el = document.createElement("template");

    el.innerHTML = `
      <a href="/profile/${item.user_id}" class="friend-list-item">
          <img />
          <span>${item.name}</span>
      </a>
    `;

    return el.content;
  }

  extractItems(response) {
    return response?.result?.friends;
  }
}

window.customElements.define("friend-list-full", FriendListFull);
