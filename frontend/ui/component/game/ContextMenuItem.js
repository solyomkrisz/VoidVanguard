import * as UI from "../../UI.js";

export default class ContextMenuItem extends HTMLElement {
  constructor() {
    super();

    this.action = null;
    this.shadowDOM = this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        padding: 8px 16px;
        border-radius: inherit;
        display: block;
        cursor: pointer;
        user-select: none;
      }

      p {
        margin: 0;
      }

      :host(:hover) {
        background: #333;
      }
    `);
    this.shadowDOM.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    this.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("select", {
          detail: {
            action: this.action,
          },
          bubbles: true,
          composed: true,
        }),
      );
    });
  }

  addTitle(title) {
    this.shadowDOM.appendChild(UI.element("p", UI.text(title)));
    return this;
  }

  setAction(value) {
    this.action = value;
    return this;
  }
}

window.customElements.define("context-menu-item", ContextMenuItem);
