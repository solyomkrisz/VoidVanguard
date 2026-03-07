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
          padding: 10px;
          border-radius: 8px;
          background-color: #555;
          color: white;
          -webkit-box-shadow: inset 6px -6px 6px -5px #898989; 
          box-shadow: inset 6px -6px 6px -5px #898989;
        }

        p {
            margin: 0;
        }

        hr {
          margin-block: 6px;
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
