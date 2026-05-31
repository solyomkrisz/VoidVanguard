/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/layout/ViewSwitcher.js
 * Szerep: Template-alapu nezetszervezo navigacioval es opcionális view-cache-sel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { el } from "/ui/UI.js";

export default class ViewSwitcher extends HTMLElement {
  get noCache() {
    return this.hasAttribute("no-cache");
  }

  constructor() {
    super();

    this._built = false;
    this._elements = {};
    this._templates = new Map();
    this._navEntriesCache = new Map();
    this._viewNodesCache = new Map();
    this._active = null;
  }

  connectedCallback() {
    this.build();
    this.scanForTemplates();
    this.createNav();
    this.showInitial();
  }

  build() {
    if (this._built) return;

    this._elements.nav = this.appendChild(
      el("div", { class: "view-switcher-nav" }),
    );
    this._elements.container = this.appendChild(
      el("div", { class: "view-switcher-main" }),
    );

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

  createNav() {
    if (!this._built) return;

    for (const [id, template] of this._templates.entries()) {
      const div = document.createElement("div");

      div.textContent = template.dataset.name;
      div.addEventListener("click", () => this.setActive(id));

      this._navEntriesCache.set(id, div);
      this._elements.nav.appendChild(div);
    }
  }

  setActive(id) {
    if (!this._built) return;
    if (!this.noCache && this._active === id) return;

    const template = this._templates.get(id);
    if (!template) return;

    let view;

    if (this.noCache) {
      // no-cache modban minden valtas uj DOM-peldanyt klonoz a template-bol.
      view = Array.from(template.content.cloneNode(true).children);
    } else {
      view = this._viewNodesCache.get(id);

      if (!view) {
        // Cache modban ugyanazokat a node-okat tartjuk meg, hogy a belso allapotuk megmaradjon.
        view = Array.from(template.content.cloneNode(true).children);
        this._viewNodesCache.set(id, view);
      }
    }

    this._navEntriesCache.get(this._active)?.classList.remove("active");
    this._active = id;
    this._navEntriesCache.get(this._active)?.classList.add("active");

    this.insertView(view);
  }

  insertView(view) {
    this._elements.container.replaceChildren(...view);
  }
}

window.customElements.define("view-switcher", ViewSwitcher);
