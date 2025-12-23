import _ from "./ThrusterController.js";
import * as UI from "../UI.js";

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

  connectedCallback() {
    if (!this.source) return;

    // prettier-ignore
    this.addEventListener("thruster-selection-change", ({ detail: { checked, thruster } }) => {
      if (checked) this.source.controlledThrusters.set(thruster.id, thruster);
      else this.source.controlledThrusters.delete(thruster.id);
    });

    for (const thruster of this.source.thrusters.values()) {
      const controller = UI.element("thruster-controller");
      controller.source = thruster;
      this.shadowDOM.appendChild(controller);
    }
  }
}

window.customElements.define("ship-propulsion-panel", ShipPropulsionPanel);
