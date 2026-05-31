/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/game/ContextMenuTemplate.js
 * Szerep: Kontextusmenu tartalmi sablonja.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import _ from "/ui/component/game/ContextMenuItem.js";
import * as UI from "/ui/UI.js";

export default class ContextMenuTemplate extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.visible = false;
    this.actionHandlers = {};
    this.shadowDOM = this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        display: none;
        border-radius: inherit;
      }
    `);
    this.shadowDOM.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    this.addEventListener("select", (e) =>
      this.actionHandlers[e.detail.action](this.source)
    );
  }

  setSource(source) {
    this.source = source;
  }

  addMenuItem(title, action, handler) {
    this.actionHandlers[action] = handler;
    const item = UI.element("context-menu-item")
      .addTitle(title)
      .setAction(action);
    this.shadowDOM.appendChild(item);
  }

  show() {
    if (this.visible) return;
    this.visible = true;

    this.style.display = "block";
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;

    this.style.display = "none";
  }
}

window.customElements.define("context-menu-template", ContextMenuTemplate);
