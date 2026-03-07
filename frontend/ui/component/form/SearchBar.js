import _ from "/ui/component/data/CollectionView.js";
import _1 from "/ui/component/core/StateProviderElement.js";
import { debounce } from "../../../common/common.js";

export default class SearchBar extends HTMLElement {
  static get observedAttributes() {
    return ["base-url"];
  }

  get baseUrl() {
    return this.getAttribute("base-url");
  }

  set baseUrl(value) {
    this.setAttribute("base-url", value);
    this.build();
  }

  constructor() {
    super();
  }

  connectedCallback() {
    if (this._initialized) return;
    this.build();
    this._initialized = true;
  }

  build() {
    this.innerHTML += `
        <input type="text" autocomplete="off" placeholder="Írjon ide a kereséshez" />
        <state-provider></state-provider>
    `;

    const template = this.querySelector("template");

    if (!template) return;

    const fragment = template.content.cloneNode(true);
    const collection = fragment.querySelector("collection-view");
    collection.setAttribute("subscribe", "");
    const stateProvider = this.querySelector("state-provider");

    stateProvider.appendChild(fragment);

    const handleInput = debounce(({ target }) => {
      const value = target.value;

      if (!value) {
        collection.clear();
        return;
      }

      stateProvider.src = this.baseUrl.replace(
        "{value}",
        encodeURIComponent(target.value),
      );
    }, 1000);

    const input = this.querySelector("input");

    input.addEventListener("input", handleInput);
    input.addEventListener("focus", () => (collection.hidden = false));
    document.addEventListener("pointerdown", ({ target }) => {
      if (!this.contains(target)) {
        collection.hidden = true;
      }
    });
  }
}

window.customElements.define("search-bar", SearchBar);
