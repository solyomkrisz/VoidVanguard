import _ from "/ui/component/game/StatusDiagram.js";
import * as UI from "/ui/UI.js";

export default class ThrusterController extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
        :host {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          color: #6ab8ff;
          font-family: 'Courier New', monospace;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s ease;
        }

        :host > * {
          box-sizing: border-box;
        }

        :host(:hover) {
          background: rgba(42, 90, 158, 0.25);
        }

        :host(.active) {
          background: rgba(50, 110, 60, 0.35);
          box-shadow: inset 0 0 0 1px rgba(80, 200, 100, 0.3);
        }

        .identificator {
          font-size: 20px;
          font-weight: bold;
          color: #c8e0ff;
          min-width: 28px;
          text-align: center;
          text-shadow: 0 0 6px rgba(106, 184, 255, 0.6);
        }
    `);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.clicked = false;

    this.gimbalDiagram = this.shadowRoot.appendChild(
      UI.element("status-diagram"),
    );
    this.throttleDiagram = this.shadowRoot.appendChild(
      UI.element("status-diagram"),
    );
  }

  setSource(source) {
    this.source = source;
    return this;
  }

  build() {
    if (!this.source) return;

    const id = this.shadowRoot.insertBefore(
      UI.element("div", UI.text(this.source.id)),
      this.gimbalDiagram,
    );
    id.classList.add("identificator");

    this.addEventListener("click", () => {
      this.clicked = !this.clicked;

      this.classList.toggle("active");

      this.dispatchEvent(
        new CustomEvent("thruster-selection-change", {
          detail: {
            active: this.clicked,
            thruster: this.source,
          },
          bubbles: false,
          composed: true,
        }),
      );
    });
  }

  disconnectedCallback() {
    this.clicked = false;
  }
}

window.customElements.define("thruster-controller", ThrusterController);
