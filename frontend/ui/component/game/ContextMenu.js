import _ from "./ContextMenuItem.js";
import * as UI from "../../UI.js";

export default class ContextMenu extends HTMLElement {
  constructor() {
    super();

    this.visible = false;
    this.hovered = null;
    this.source = null;
    this.template = {};
    this.mouse = { x: 0, y: 0 };
    this.shadowDOM = this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
        :host {
          position: absolute;
          z-index: 1003;
          max-width: 250px;
          display: none;
          padding: 6px;
          border-radius: 8px;
          background-color: #555;
          color: white;
          -webkit-box-shadow: inset 6px -6px 6px -5px #898989; 
          box-shadow: inset 6px -6px 6px -5px #898989;
        }
    `);
    this.shadowDOM.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    document.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    this.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  addTemplate(name, template) {
    template.source = this.source;
    this.template[name] = template;
    this.shadowDOM.appendChild(template);
  }

  updateTemplates() {
    for (const value of Object.values(this.template)) value.hide();
  }

  setPosition() {
    const domRect = this.getBoundingClientRect();

    let x = this.mouse.x;
    let y = this.mouse.y;

    if (y + domRect.height > window.innerHeight) {
      this.style.top = window.innerHeight - domRect.height + "px";
    } else this.style.top = y + "px";

    if (x + domRect.width > window.innerWidth) {
      this.style.left = window.innerWidth - domRect.width + "px";
    } else this.style.left = x + "px";
  }

  show() {
    if (!this.hovered) return;

    this.updateTemplates();

    this.source = this.hovered;
    this.source.contextMenuTemplate.source = this.source;
    this.source.contextMenuTemplate.show();
    // if (this.visible) return;
    this.visible = true;

    this.style.display = "block";
    this.setPosition();

    document.dispatchEvent(
      new CustomEvent("context-menu-active", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;

    this.style.display = "none";

    document.dispatchEvent(
      new CustomEvent("context-menu-inactive", {
        bubbles: true,
        composed: true,
      }),
    );

    this.source = null;
  }
}

window.customElements.define("context-menu", ContextMenu);
