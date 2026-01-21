import * as UI from "../UI.js";

export default class StatusDiagram extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        --border-radius: 8px;
        --border-width: 2px;

        width: auto;
        height: 100%;
        display: flex;
      }

      :host * {
        box-sizing: border-box;
      }
      
      .border {
        width: inherit;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: var(--border-radius);
        border: var(--border-width) solid #444;
        background-color: #111;
        transition: border 0.3s ease;
      }

      img {
        width: calc(100% - calc(var(--border-width) * 2));
        height: calc(100% - calc(var(--border-width) * 2));
        border-radius: calc(var(--border-radius) / 2);
        transition: transform 0.3s ease;
        transform-origin: bottom left;
      }
      
      /*:host(:hover) .border {
        border-color: transparent;
      }*/

      :host(.hoverable:hover) img {
        --offset: 10px;

        transform: translate(calc(-10px - var(--border-radius) / 2), calc(-100% - 10px - var(--offset))) scale(2);
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.border = this.shadowRoot.appendChild(UI.element("div"));
    this.border.classList.add("border");
    this.image = this.border.appendChild(UI.element("img"));
    this.image.draggable = false;

    this.hoverable = false;
  }

  enableHover() {
    this.hoverable = true;

    return this;
  }

  connectedCallback() {
    this.hoverable && this.classList.add("hoverable");
  }

  set(canvas, type, quality) {
    this.image.src = canvas.toDataURL(type, quality);
  }
}

window.customElements.define("status-diagram", StatusDiagram);
