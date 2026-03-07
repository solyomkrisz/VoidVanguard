import _ from "./ThrusterController.js";
import * as UI from "../../UI.js";

export default class ShipPropulsionPanel extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.shadowDOM = this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
        :host {
          position: absolute;
          z-index: 1002;
          top: 50%;
          right: 0;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 20px;
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

    // prettier-ignore
    this.addEventListener("thruster-selection-change", ({ detail: { checked, thruster } }) => {
      if (checked) this.source.controlledThrusters.set(thruster.id, thruster);
      else this.source.controlledThrusters.delete(thruster.id);
    });

    // prettier-ignore
    this.addEventListener("thruster-insert", ({ detail: { thruster } }) => {
      this.shadowDOM.appendChild(thruster.controller);
    });
  }
}

window.customElements.define("ship-propulsion-panel", ShipPropulsionPanel);
