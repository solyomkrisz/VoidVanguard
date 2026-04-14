import Thruster from "../../../game/Thruster.js";
import * as UI from "../../UI.js";

export default class ThrusterController extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.shadowDOM = this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
        :host {
          padding: 0.8vmin 1.5vmin;
          border-top-left-radius: 8px;
          border-bottom-left-radius: 8px;
          background: #1a1a28;
          border: 2px solid #2a5a9e;
          border-right: none;
          box-shadow: -4px 0 0 0 #0d0d15;
          color: #6ab8ff;
          font-size: 1.4vmin;
          font-family: 'Jersey', 'Courier New', monospace;
          text-transform: uppercase;
          letter-spacing: 0.05vmin;
          text-shadow: 1px 1px 0 #000;
        }
        input[type="checkbox"] {
          accent-color: #4a90e2;
          width: 1.2vmin;
          height: 1.2vmin;
          cursor: pointer;
        }
    `);
    this.shadowDOM.adoptedStyleSheets = [sheet];

    this.checkbox = null;
  }

  setSource(source) {
    this.source = source;
    return this;
  }

  toggleCheckbox() {
    this.checkbox && (this.checkbox.checked = false);
    return this;
  }

  build() {
    if (!this.source) return;

    for (const key of this.source.constructor.LISTED_PROPERTIES) {
      // prettier-ignore
      const container = UI.element("div", UI.element("span", UI.text(key + ": ")));
      this[key] = container.appendChild(
        UI.element("span", UI.text(this.source[key])),
      );

      this.shadowDOM.appendChild(container);
    }

    this.checkbox = UI.element("input");
    this.checkbox.type = "checkbox";

    this.checkbox.addEventListener("change", ({ target }) => {
      this.dispatchEvent(
        new CustomEvent("thruster-selection-change", {
          detail: {
            checked: target.checked,
            thruster: this.source,
          },
          bubbles: false,
          composed: true,
        }),
      );
    });

    this.shadowDOM.appendChild(this.checkbox);
  }
}

window.customElements.define("thruster-controller", ThrusterController);
