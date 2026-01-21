import _ from "./StatusDiagram.js";
import * as UI from "../UI.js";

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
          padding: 10px;
          /*border-top-left-radius: 8px;
          border-bottom-left-radius: 8px;
          background-color: #555;*/
          color: white;
          font-family: Arial;
          /*-webkit-box-shadow: inset 8px -8px 6px -5px #898989; 
          box-shadow: inset 8px -8px 6px -5px #898989;*/
          cursor: pointer;
          user-select: none;
        }

        :host(:hover) {
          background-color: #444;
        }

        :host.active {
          background-color: green;
        }

        .identificator {
          font-size: 26px;
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

  // prettier-ignore
  build() {
    if (!this.source) return;

    const id = this.shadowRoot.insertBefore(UI.element("div", UI.text(this.source.id)), this.gimbalDiagram);
    id.classList.add("identificator");

    this.addEventListener("click", () => {
      this.clicked = !this.clicked;

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
