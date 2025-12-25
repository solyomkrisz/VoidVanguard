import Thruster from "../../game/Thruster.js";
import * as UI from "../UI.js";

export default class ThrusterController extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.shadowDOM = this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
        :host {
          padding: 10px;
          border-top-left-radius: 8px;
          border-bottom-left-radius: 8px;
          background-color: #555;
          color: white;
          -webkit-box-shadow: inset 10px -10px 6px -5px #898989; 
          box-shadow: inset 10px -10px 6px -5px #898989;
        }
    `);
    this.shadowDOM.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    if (!this.source) return;

    this.source.controller = this;

    for (const key of Thruster.LISTED_PROPERTIES) {
      // prettier-ignore
      const container = UI.element("div", UI.element("span", UI.text(key + ": ")));
      this[key] = container.appendChild(
        UI.element("span", UI.text(this.source[key]))
      );

      this.shadowDOM.appendChild(container);
    }

    const checkbox = UI.element("input");
    checkbox.type = "checkbox";

    checkbox.addEventListener("change", ({ target }) => {
      this.getRootNode().host.dispatchEvent(
        new CustomEvent("thruster-selection-change", {
          detail: {
            checked: target.checked,
            thruster: this.source,
            bubbles: false,
            composed: true,
          },
        })
      );
    });

    this.shadowDOM.appendChild(checkbox);
  }
}

window.customElements.define("thruster-controller", ThrusterController);
