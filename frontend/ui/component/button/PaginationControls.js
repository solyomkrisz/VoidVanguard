/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/button/PaginationControls.js
 * Szerep: Lapozo vezerlo oldalszamokkal es szulo altal visszaigazolt oldalvaltassal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export default class PaginationControls extends HTMLElement {
  static get observedAttributes() {
    return ["page", "total"];
  }

  constructor() {
    super();

    this._currentPage = 1;
    this._totalPages = 1;
    this._container = null;

    this._built = false;

    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    const page = Number(e.currentTarget.dataset.page);
    if (page < 1 || page > this._totalPages || page === this._currentPage)
      return;

    // this._currentPage = page;
    // this.setAttribute("page", page);

    // A komponens csak kerest kuld a lapvaltasra; a tenyleges adatbetoltest a szulo vegzi el.
    this.dispatchEvent(
      new CustomEvent("page-request", {
        detail: { page, onDone: () => this.onSuccessfulPageLoad(page) },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onSuccessfulPageLoad(page) {
    this._currentPage = page;
    this.setAttribute("page", page);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === "page") this._currentPage = Number(newValue) || 1;
    if (name === "total") this._totalPages = Number(newValue) || 1;

    this.render();
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    this._container = this.appendChild(document.createElement("div"));

    this._built = true;

    this.render();
  }

  createPageButton(page) {
    const button = document.createElement("button");

    button.textContent = page;
    button.dataset.page = page;
    button.dataset.sfx = "click_1";

    if (page === this._currentPage) {
      button.disabled = true;
    }

    button.addEventListener("click", this.onClick);

    return button;
  }

  createEllipsis() {
    const span = document.createElement("span");

    span.textContent = "...";
    span.style.margin = "0 4px";

    return span;
  }

  render() {
    if (!this._container) return;

    this._container.textContent = "";

    const maxVisible = 5;

    const prev = document.createElement("button");
    prev.textContent = "Előző";
    prev.disabled = this._currentPage <= 1;
    prev.dataset.page = this._currentPage - 1;
    prev.dataset.sfx = "click_1";
    prev.addEventListener("click", this.onClick);
    this._container.appendChild(prev);

    {
      const maxWindow = 2;
      const start = Math.max(1, this._currentPage - maxWindow);
      const end = Math.min(this._totalPages, this._currentPage + maxWindow);

      // Nem az osszes oldalszam latszik, csak az aktualis oldal kornyezete es a ket szelso oldal.
      if (start > 1) {
        this._container.appendChild(this.createPageButton(1));

        if (start > 2) {
          this._container.appendChild(this.createEllipsis());
        }
      }

      for (let i = start; i <= end; i++) {
        this._container.appendChild(this.createPageButton(i));
      }

      if (end < this._totalPages) {
        if (end < this._totalPages - 1) {
          this._container.appendChild(this.createEllipsis());
        }

        this._container.appendChild(this.createPageButton(this._totalPages));
      }
    }

    const next = document.createElement("button");
    next.textContent = "Következő";
    next.disabled = this._currentPage >= this._totalPages;
    next.dataset.page = this._currentPage + 1;
    next.dataset.sfx = "click_1";
    next.addEventListener("click", this.onClick);
    this._container.appendChild(next);
  }
}

window.customElements.define("pagination-controls", PaginationControls);
