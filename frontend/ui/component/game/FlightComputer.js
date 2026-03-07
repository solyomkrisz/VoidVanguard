import * as UI from "../../UI.js";
import _ from "./AutopilotToggle.js";

export default class FlightComputer extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.shadowDOM = this.attachShadow({ mode: "open" });

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
        padding: 10px 20px;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        background-color: #555;
        color: #fff;
        -webkit-box-shadow: inset 8px -8px 6px -5px #898989; 
        box-shadow: inset 8px -8px 6px -5px #898989;
      }
    `);
    this.shadowDOM.adoptedStyleSheets = [sheet];
  }

  setSource(source) {
    this.source = source;
    return this;
  }

  connectedCallback() {
    if (!this.source) return;

    const autopilotToggle = UI.element("autopilot-toggle");
    this.shadowDOM.appendChild(autopilotToggle);

    this.addEventListener("autopilot-toggle", (e) => {
      if (e.detail.checked)
        this.source.updatePropulsion = this.source.autoPropulsionUpdate;
      else this.source.updatePropulsion = this.source.manualPropulsionUpdate;
    });
  }
}

window.customElements.define("flight-computer", FlightComputer);
