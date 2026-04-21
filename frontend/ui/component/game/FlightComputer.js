import * as UI from "/ui/UI.js";
import _ from "/ui/component/game/AutopilotToggle.js";

export default class FlightComputer extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.shadowDOM = this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        // position: absolute;
        // z-index: 1001;
        // left: 50%;
        // bottom: 0;
        // transform: translateX(-50%);
        box-sizing: border-box;
        max-width: 550px;
        width: 100%;
        max-height: 100px;
        height: 100%;
        padding: 0.8vmin 1.5vmin;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        background: #1a1a28;
        border: 2px solid #2a5a9e;
        border-bottom: none;
        box-shadow: 0 -4px 0 0 #0d0d15;
        color: #6ab8ff;
        font-size: 1.4vmin;
        font-family: 'Jersey', 'Courier New', monospace;
        text-transform: uppercase;
        letter-spacing: 0.05vmin;
        text-shadow: 1px 1px 0 #000;
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
