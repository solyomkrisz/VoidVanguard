import * as UI from "../UI.js";
import _ from "./AutopilotToggle.js";
import _1 from "./StatusDiagram.js";

export default class FlightComputer extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        position: absolute;
        z-index: 1001;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
        max-width: 550px;
        width: 100%;
        max-height: 100px;
        height: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        background-color: #555;
        color: #fff;
        -webkit-box-shadow: inset 8px -8px 6px -5px #898989; 
        box-shadow: inset 8px -8px 6px -5px #898989;
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.statusDiagram = UI.element("status-diagram").enableHover();
  }

  setSource(source) {
    this.source = source;
    return this;
  }

  connectedCallback() {
    if (!this.source) return;

    this.shadowRoot.appendChild(this.statusDiagram);

    const autopilotToggle = UI.element("autopilot-toggle");
    this.shadowRoot.appendChild(autopilotToggle);

    this.addEventListener("autopilot-toggle", (e) => {
      if (e.detail.checked)
        this.source.updatePropulsion = this.source.autoPropulsionUpdate;
      else this.source.updatePropulsion = this.source.manualPropulsionUpdate;
    });
  }
}

window.customElements.define("flight-computer", FlightComputer);
