import * as UI from "../../UI.js";
import _ from "./TooltipTemplate.js";

export default class DynamicTooltip extends HTMLElement {
  static DIRTY = Object.freeze({
    NONE: 0,
    CONTENT: 1 << 0,
  });

  constructor() {
    super();

    this.template = {};

    this.disabled = false;
    this.displayed = false;
    this.dirty = DynamicTooltip.DIRTY.CONTENT;
    this.source = null;
    this.visible = false;
    this.shadowDOM = this.attachShadow({ mode: "open" });
    this.domRect = new DOMRect();

    this.offset = { x: 5, y: 5 };
    this.mouse = { x: -1000, y: -1000 };

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        display: none;
        flex-direction: column;
        gap: 10px;
        position: absolute;
        z-index: 1001;
        user-select: none;
        pointer-events: none;
        max-width: 250px;
      }
    `);
    this.shadowDOM.adoptedStyleSheets = [sheet];

    this.onContentChange = this.onContentChange.bind(this);
    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);
  }

  connectedCallback() {
    document.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      this.visible && this.setPosition();
    });

    this.addEventListener("content-change", this.onContentChange);
    document.addEventListener("context-menu-active", this.disable);
    document.addEventListener("context-menu-inactive", this.enable);
  }

  createTemplate(name, title, inner) {
    const template = UI.element("tooltip-template").addTitle(title);
    for (const [txt, id] of inner) template.addListElement(txt, id);
    this.template[name] = template;
  }

  show() {
    if (this.visible || this.disabled) return;

    this.visible = true;
    this.style.display = "flex";
  }

  hide() {
    if (!this.visible || this.displayed || this.disabled) return;

    this.visible = false;
    this.style.display = "none";
  }

  enable() {
    this.disabled = false;
  }

  disable() {
    this.displayed = false;
    this.hide();
    this.disabled = true;
  }

  setPosition() {
    let x = this.mouse.x - this.domRect.width - this.offset.x;
    let y = this.mouse.y - this.domRect.height / 2 - this.offset.y;

    x < 0 && (x = this.mouse.x + this.offset.x);
    y < 0 && (y = Math.abs(this.offset.y));
    y + this.domRect.height > window.innerHeight &&
      (y = window.innerHeight - this.domRect.height - Math.abs(this.offset.y));

    this.style.left = x + "px";
    this.style.top = y + "px";
  }

  onContentChange() {
    window.queueMicrotask(() => {
      if (this.dirty === DynamicTooltip.DIRTY.NONE) return;

      this.domRect = this.getBoundingClientRect();
      this.setPosition();

      this.dirty &= ~DynamicTooltip.DIRTY.CONTENT;
    });
  }

  updateTemplates(frameId) {
    for (const [_, value] of Object.entries(this.template))
      value.lastActive !== frameId && value.hide();
  }

  /**
   * @returns {boolean} - Returns true if the previous source of the template is the same as the new, otherwise false.
   */
  showTemplate(source, template, frameId) {
    if (this.disabled) return;

    template.lastActive = frameId;
    this.displayed = true;

    !template.active && this.shadowDOM.appendChild(template);
    template.show();

    return template.setSource(source);
  }
}

window.customElements.define("dynamic-tooltip", DynamicTooltip);
