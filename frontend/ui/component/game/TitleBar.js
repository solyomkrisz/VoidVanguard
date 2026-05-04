import * as UI from "/ui/UI.js";

export default class TitleBar extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        width: 100%;
        height: 24px;
        display: flex;
        align-items: center;
        padding-left: 8px;
        border-top-left-radius: inherit;
        border-top-right-radius: inherit;
        background: #0e0e1a;
        border-bottom: 1px solid #2a5a9e;
        color: #6ab8ff;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        user-select: none;
        cursor: grab;
      }

      :host(:active) {
        cursor: grabbing;
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.offsetX = 0;
    this.offsetY = 0;

    this.shadowRoot.appendChild(UI.text("Hajtóművezérlő"));
  }

  setSource(source) {
    this.source = source;
    return this;
  }

  // prettier-ignore
  snapHorizontal(e, domRect) {
    const snapOffset = 50;

    if (e.clientX - this.offsetX + domRect.width + snapOffset >= window.innerWidth) {
      this.source.style.left = window.innerWidth - domRect.width + "px";
      this.source.dataset.horizontalSnap = "right";
      return true;
    }

    if (e.clientX - this.offsetX - snapOffset <= 0) {
      this.source.style.left = 0 + "px";
      this.source.dataset.horizontalSnap = "left";
      return true;
    }

    return false;
  }

  // prettier-ignore
  snapVertical(e, domRect) {
    const snapOffset = 50;

    if (e.clientY - this.offsetY - snapOffset <= 0) {
      this.source.style.top = 0 + "px";
      this.source.dataset.verticalSnap = "top";
      return true;
    }

    if (e.clientY - this.offsetY + domRect.height + snapOffset >= window.innerHeight) {
      this.source.style.top = window.innerHeight - domRect.height + "px";
      this.source.dataset.verticalSnap = "bottom";
      return true;
    }

    return false;
  }

  connectedCallback() {
    document.addEventListener("mousedown", (e) => {
      const domRect = this.getBoundingClientRect();

      if (e.clientX >= domRect.left && e.clientX <= domRect.right &&
          e.clientY >= domRect.top  && e.clientY <= domRect.bottom) {
        this.source.dragged = true;
      }

      this.offsetX = e.clientX - domRect.left;
      this.offsetY = e.clientY - domRect.top;
    });

    document.addEventListener("mouseup", () => (this.source.dragged = false));

    // prettier-ignore
    document.addEventListener("mousemove", (e) => {
      if (!this.source.dragged) return;

      const domRect = this.source.getBoundingClientRect();

      if (!this.snapHorizontal(e, domRect)) {
        this.source.style.left = e.clientX - this.offsetX + "px";
        this.source.dataset.horizontalSnap = "none";
      }

      if (!this.snapVertical(e, domRect)) {
        this.source.style.top = e.clientY - this.offsetY + "px";
        this.source.dataset.verticalSnap = "none";
      }
    });
  }
}

window.customElements.define("title-bar", TitleBar);
