export default class FriendListPreview extends HTMLElement {
  set data(value) {
    this._data = value;
    this.renderContent();
  }

  get data() {
    return this._data;
  }

  constructor() {
    super();

    this._data = null;
    this._built = false;
    this._container = null;
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
  }

  build() {
    this._container = this.appendChild(document.createElement("div"));
    this._built = true;
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

  renderContent() {
    if (!Array.isArray(this.data)) {
      console.warn("Invalid data format.");
      return;
    }

    if (!this._container) return;

    this._container.textContent = "";

    for (const item of this.data) {
      this._container.appendChild(this.renderItem(item));
    }
  }
}

window.customElements.define("friend-list-preview", FriendListPreview);
