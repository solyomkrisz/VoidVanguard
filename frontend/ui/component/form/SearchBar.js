/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/form/SearchBar.js
 * Szerep: Egyszeru keresomezo, ami a talalati lista src attributumaval vezerli a keresest.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
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

      // Maga a lista vegzi a lekerest; itt csak a kovetkezo API-cimet allitjuk be neki.
      itemList.setAttribute(
        "src",
        `/api/users?search=${encodeURIComponent(value)}`,
      );
    }, 150);

    input.addEventListener("input", handleInput);

    this._built = true;
  }
}

window.customElements.define("search-bar", SearchBar);
