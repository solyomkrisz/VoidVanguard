import { el } from "/ui/UI.js";

export default class DrilldownMenu extends HTMLElement {
  get noCache() {
    return this.hasAttribute("no-cache");
  }

  get lastActive() {
    return this._history.length
      ? this._history[this._history.length - 1]
      : null;
  }

  get initial() {
    return this.getAttribute("initial");
  }

  constructor() {
    super();

    this._built = false;
    this._elements = {};
    this._templates = new Map();
    this._viewNodesCache = new Map();
    this._history = [];

    this.goBack = this.goBack.bind(this);
    this.onContainerClick = this.onContainerClick.bind(this);
  }

  goBack() {
    if (this._history.length <= 1) return;

    // remove current view
    this._history.pop();

    const view = this.getView(this.lastActive);
    if (!view) return;

    this.dispatchCurrentView();

    this.insertView(view);
  }

  connectedCallback() {
    this.build();
    this.scanForTemplates();
    this.showInitial();
  }

  onContainerClick(e) {
    const target = e.target.closest("[data-target]");
    if (!target) return;

    this.setActive(target.dataset.target);
  }

  build() {
    if (this._built) return;

    this._elements.container = el("div", {
      class: "drilldown-menu-main",
      onClick: this.onContainerClick,
    });
    this._elements.goBackButton = el(
      "button",
      {
        class: "drilldown-menu-go-back-button",
        hidden: true,
        onClick: this.goBack,
      },
      ["Vissza"],
    );

    this.appendChild(this._elements.container);
    this.appendChild(this._elements.goBackButton);

    this._built = true;
  }

  showInitial() {
    const id = this.getAttribute("initial");
    if (!id) return;

    this.setActive(id);
  }

  scanForTemplates() {
    const templates = this.querySelectorAll("template");

    for (const template of templates) {
      if (!template.id) continue;

      this._templates.set(template.id, template);
    }
  }

  toggleGoBackButton() {
    this._elements.goBackButton.hidden = this._history.length <= 1;
  }

  getView(id) {
    const template = this._templates.get(id);
    if (!template) return null;

    if (this.noCache) {
      return Array.from(template.content.cloneNode(true).children);
    }

    let view = this._viewNodesCache.get(id);

    if (!view) {
      view = Array.from(template.content.cloneNode(true).children);
      this._viewNodesCache.set(id, view);
    }

    return view;
  }

  dispatchCurrentView() {
    this.dispatchEvent(
      new CustomEvent("view-change", {
        detail: { currentView: this.lastActive || this.initial || null },
        composed: true,
        bubbles: true,
      }),
    );
  }

  setActive(id) {
    if (!this._built) return;
    if (this.lastActive === id) return;

    const view = this.getView(id);
    if (!view) return;

    this._history.push(id);

    this.dispatchCurrentView();

    this.insertView(view);
  }

  insertView(view) {
    this._elements.container.replaceChildren(...view);
    this.toggleGoBackButton();
  }

  reset() {
    if (!this._built) return;

    this._history.length = 0;

    this._elements.container.innerHTML = "";
    this.toggleGoBackButton();

    if (this.initial) {
      const view = this.getView(this.initial);
      if (!view) return;

      this._history.push(this.initial);
      this.insertView(view);
    }
  }
}

window.customElements.define("drilldown-menu", DrilldownMenu);
