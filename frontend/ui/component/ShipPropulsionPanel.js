import _ from "./ThrusterController.js";
import _1 from "./TitleBar.js";
import * as UI from "../UI.js";

export default class ShipPropulsionPanel extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
        :host {
          position: absolute;
          z-index: 1002;
          /*top: 50%;
          right: 0;
          transform: translateY(-50%);*/
          min-width: 250px;
          display: flex;
          flex-direction: column;
          /*gap: 10px;*/
          /*padding: 10px;*/
          border-top-left-radius: 8px;
          border-bottom-left-radius: 8px;
          background-color: #555;
        }

        :host > * {
          box-sizing: border-box;
        }

        :host > thruster-controller:not(:last-child) {
          border-bottom: 2px solid #333;
        }

        :host > thruster-controller:first-child {
          border-top-left-radius: inherit;
        }

        :host > thruster-controller:last-child {
          border-bottom-left-radius: inherit;
        }
    `);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.shadowRoot.appendChild(UI.element("title-bar").setSource(this));

    this.dragged = false;
  }

  setSource(source) {
    this.source = source;
    return this;
  }

  connectedCallback() {
    if (!this.source) return;

    window.queueMicrotask(() => {
      const domRect = this.getBoundingClientRect();

      this.style.left = window.innerWidth - domRect.width + "px";
      this.style.top = window.innerHeight / 2 - domRect.height / 2 + "px";
    });

    // prettier-ignore
    this.addEventListener("thruster-selection-change", ({ detail: { active, thruster } }) => {
      if (active) this.source.controlledThrusters.set(thruster.id, thruster);
      else this.source.controlledThrusters.delete(thruster.id);
    });

    // prettier-ignore
    this.addEventListener("thruster-insert", ({ detail: { thruster } }) => {
      this.shadowRoot.appendChild(thruster.controller);
    });
  }
}

window.customElements.define("ship-propulsion-panel", ShipPropulsionPanel);
