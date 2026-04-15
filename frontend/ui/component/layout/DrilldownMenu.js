import ViewSwitcher from "/ui/component/layout/ViewSwitcher.js";
import { el } from "/ui/UI.js";

export default class DrilldownMenu extends ViewSwitcher {
  constructor() {
    super();

    this.goBack = this.goBack.bind(this);
  }

  goBack(e) {
    this._elements.nav.hidden = false;
    this._elements.backButton.hidden = true;
    this._elements.container.innerHTML = "";
    this._active = null;

    this.dispatchEvent(
      new CustomEvent("go-back", {
        bubbles: true,
        composed: true,
      })
    );
  }

  connectedCallback() {
    this.build();
    this.scanForTemplates();
    this.createNav();
  }

  build() {
    if (this._built) return;

    this._elements.nav = this.appendChild(
      el("div", { class: "drilldown-menu-nav" })
    );
    this._elements.container = this.appendChild(
      el("div", { class: "drilldown-menu-main" })
    );
    this._elements.backButton = this.appendChild(
      el("button", { class: "drilldown-menu-go-back-button", hidden: true }, [
        "Vissza",
      ])
    );

    this._elements.backButton.addEventListener("click", this.goBack);

    this._built = true;
  }

  insertView(view) {
    this._elements.nav.hidden = true;
    this._elements.backButton.hidden = false;
    this._elements.container.replaceChildren(...view);

    this.dispatchEvent(
      new CustomEvent("view-change", {
        bubbles: true,
        composed: true,
      })
    );
  }
}

window.customElements.define("drilldown-menu", DrilldownMenu);
