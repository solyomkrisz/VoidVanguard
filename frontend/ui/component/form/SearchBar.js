import { debounce } from "/common/common.js";

export default class SearchBar extends HTMLElement {
  get controls() {
    return this.getAttribute("controls");
  }

  get pageSize() {
    return this.getAttribute("page-size");
  }

  get baseUrl() {
    return this.getAttribute("base-url");
  }

  constructor() {
    super();

    this._built = false;
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    const input = document.createElement("input");
    input.type = "text";
    this.insertBefore(input, this.firstChild);

    const itemList = this.querySelector("search-bar-result-list");

    const handleInput = debounce(async ({ target }) => {
      const value = target.value;

      if (!value) {
        itemList.reset();
        itemList.removeAttribute("src");

        return;
      }

      itemList.setAttribute(
        "src",
        `/api/users?search=${encodeURIComponent(value)}`,
      );
    }, 1000);

    input.addEventListener("input", handleInput);

    this._built = true;
  }
}

window.customElements.define("search-bar", SearchBar);
