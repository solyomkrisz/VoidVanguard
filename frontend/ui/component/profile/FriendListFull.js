import LazyItemList from "/ui/component/data/LazyItemList.js";

export default class FriendListFull extends LazyItemList {
  constructor() {
    super();
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
