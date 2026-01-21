import * as UI from "../UI.js";

export default class TitleBar extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
        :host {
          width: 100%;
          height: 20px;
          display: flex;
          align-items: center;
          padding-left: 6px;
          border-top-left-radius: inherit;
          border-top-right-radius: inherit;
          background-color: #333;
          color: #fff;
          font-family: Arial;
          font-size: 14px;
          user-select: none;
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

  connectedCallback() {
    // prettier-ignore
    document.addEventListener("mousedown", (e) => {
      const domRect = this.getBoundingClientRect();

      if (e.clientX >= domRect.left && e.clientX <= domRect.right && e.clientY >= domRect.top && e.clientY <= domRect.bottom) {
        this.source.dragged = true;
      }

      this.offsetX = e.clientX - domRect.left;
      this.offsetY = e.clientY - domRect.top;
    });

    document.addEventListener("mouseup", (e) => (this.source.dragged = false));

    document.addEventListener("mousemove", (e) => {
      if (!this.source.dragged) return;

      const domRect = this.source.getBoundingClientRect();

      const snapOffset = 50;

      // prettier-ignore
      if (e.clientX - this.offsetX + domRect.width + snapOffset >= window.innerWidth) {
        this.source.style.left = window.innerWidth - domRect.width + "px";

        this.source.style.borderTopRightRadius = 0;
        this.source.style.borderBottomRightRadius = 0;
      } else {
        this.source.style.left = e.clientX - this.offsetX + "px";

        this.source.style.borderTopRightRadius = 8 + "px";
        this.source.style.borderBottomRightRadius = 8 + "px";
      }

      this.source.style.top = e.clientY - this.offsetY + "px";
    });
  }
}

window.customElements.define("title-bar", TitleBar);
