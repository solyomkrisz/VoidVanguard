/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/game/StatusDiagram.js
 * Szerep: Allapotadatokat diagramkent megjelenito panel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as UI from "/ui/UI.js";

export default class StatusDiagram extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        --border-radius: 8px;
        --border-width: 2px;

        width: 100%;
        min-width: 0;
        max-width: 100%;
        height: 100%;
        max-height: 100%;
        display: flex;
      }

      :host * {
        box-sizing: border-box;
      }

      .border {
        width: 100%;
        min-width: 0;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: var(--border-radius);
        border: var(--border-width) solid #1a3a6e;
        background-color: #0a0a14;
        overflow: hidden;
        transition: border 0.3s ease;
      }

      :host(:hover) .border {
        border-color: #2a5a9e;
      }

      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: inherit;
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.border = this.shadowRoot.appendChild(UI.element("div"));
    this.border.classList.add("border");
    this.image = this.border.appendChild(UI.element("img"));
    this.image.draggable = false;

    this.hoverable = false;
    this._preview = null;
    this._onEnter = null;
    this._onLeave = null;
  }

  enableHover() {
    this.hoverable = true;
    return this;
  }

  connectedCallback() {
    if (!this.hoverable) return;

    // Build a fixed-position preview portal that lives on document.body,
    // bypassing any overflow:hidden ancestor (e.g. FlightComputer).
    this._preview = document.createElement("img");
    this._preview.style.cssText = [
      "position:fixed",
      "z-index:9999",
      "display:none",
      "pointer-events:none",
      "border-radius:8px",
      "border:2px solid #2a5a9e",
      "background:#0a0a14",
      "box-shadow:0 4px 24px rgba(0,0,0,0.85)",
      "width:auto",
      "height:auto",
      "max-width:min(200px, 40vmin)",
      "max-height:min(200px, 40vmin)",
      "transition:opacity 0.18s ease, transform 0.18s ease",
      "transform-origin:bottom left",
      "opacity:0",
      "transform:scale(0.85)",
    ].join(";");
    document.body.appendChild(this._preview);

    this._onEnter = () => {
      if (!this.image.src) return;
      this._preview.src = this.image.src;
      this._preview.style.display = "block";

      // Position after display:block so dimensions are available
      requestAnimationFrame(() => {
        const rect = this.getBoundingClientRect();
        const pw = this._preview.offsetWidth  || 160;
        const ph = this._preview.offsetHeight || 160;

        // Anchor bottom-left of preview above the element
        let left = rect.left;
        let top  = rect.top - ph - 8;

        // Keep inside viewport
        if (left + pw > window.innerWidth  - 8) left = window.innerWidth  - pw - 8;
        if (left < 4) left = 4;
        if (top  < 4) top  = rect.bottom + 8; // flip below if no room above

        this._preview.style.left = `${left}px`;
        this._preview.style.top  = `${top}px`;

        // Force reflow then animate in
        this._preview.getBoundingClientRect();
        this._preview.style.opacity   = "1";
        this._preview.style.transform = "scale(1)";
      });
    };

    this._onLeave = () => {
      this._preview.style.opacity   = "0";
      this._preview.style.transform = "scale(0.85)";
      setTimeout(() => { this._preview.style.display = "none"; }, 200);
    };

    this.addEventListener("mouseenter", this._onEnter);
    this.addEventListener("mouseleave", this._onLeave);
  }

  disconnectedCallback() {
    this._preview?.remove();
    this._preview = null;
    if (this._onEnter) this.removeEventListener("mouseenter", this._onEnter);
    if (this._onLeave) this.removeEventListener("mouseleave", this._onLeave);
  }

  set(canvas, type, quality) {
    this.image.src = canvas.toDataURL(type, quality);
    if (this._preview && this._preview.style.display !== "none") {
      this._preview.src = this.image.src;
    }
  }
}

window.customElements.define("status-diagram", StatusDiagram);
