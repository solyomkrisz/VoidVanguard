import * as UI from "../../UI.js";
import DynamicTooltip from "./DynamicTooltip.js";

export default class TooltipTemplate extends HTMLElement {
  constructor() {
    super();

    this.active = false;
    this.visible = false;
    this.lastActive = -1;

    this.source = null;
    this.shadowDOM = this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
        :host {
          overflow-wrap: break-word;
          word-break: break-word;
          padding: 0.5vmin 1.1vmin 0.6vmin;
          background: rgba(6, 8, 20, 0.88);
          border-right: 2px solid #1e3a5f;
          border-bottom: 2px solid #1e3a5f;
          border-left: 2px solid #0a1628;
          border-top: 2px solid #1e3a5f;
          font-family: 'Jersey', 'Courier New', monospace;
          -webkit-font-smoothing: none;
          font-smooth: never;
        }

        p {
          margin: 0;
          font-size: 1.4vmin;
          color: #c8e6ff;
          text-shadow: 0 0 6px rgba(100, 180, 255, 0.55), 1px 1px 0 #000;
          line-height: 1.5;
        }

        strong {
          font-size: 1.6vmin;
          color: #4a7fb5;
          letter-spacing: 0.12em;
          text-shadow: 0 0 4px #0d2a50;
          text-transform: uppercase;
        }

        hr {
          margin-block: 4px;
          border: none;
          border-top: 1px solid #1e3a5f;
        }

        span {
          color: #c8e6ff;
        }
    `);
    this.shadowDOM.adoptedStyleSheets = [sheet];
  }

  dispatchContentChangeEvent() {
    const parent = this.getRootNode().host;

    parent.dirty |= DynamicTooltip.DIRTY.CONTENT;
    parent.dispatchEvent(new CustomEvent("content-change"));
  }

  connectedCallback() {
    this.active = true;
    this.dispatchContentChangeEvent();
  }

  disconnectedCallback() {
    this.active = false;
    this.hide();
  }

  setSource(source) {
    this.source !== source && this.dispatchContentChangeEvent();

    const previousSource = this.source;
    this.source = source;

    return previousSource === this.source;
  }

  show() {
    if (this.visible) return;

    this.style.display = "block";
    this.visible = true;

    this.dispatchContentChangeEvent();
  }

  hide() {
    if (!this.visible) return;

    this.style.display = "none";
    this.visible = false;

    this.dispatchContentChangeEvent();
  }

  addTitle(title) {
    this.shadowDOM.appendChild(
      UI.element("p", UI.element("strong", UI.text(title))),
    );
    this.shadowDOM.appendChild(UI.element("hr"));

    return this;
  }

  addListElement(txt, id) {
    if (id === "id" || id === "class") return;

    const p = UI.element("p", UI.element("span", UI.text(txt)));
    const span = UI.element("span");
    this[id] = span;
    p.appendChild(span);
    this.shadowDOM.appendChild(p);
  }
}

window.customElements.define("tooltip-template", TooltipTemplate);
