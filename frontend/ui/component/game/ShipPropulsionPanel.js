import _ from "/ui/component/game/ThrusterController.js";
import _1 from "/ui/component/game/TitleBar.js";
import * as UI from "/ui/UI.js";

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
          min-width: 250px;
          display: flex;
          flex-direction: column;
          border-radius: 8px;
          background: #1a1a28;
          border: 2px solid #2a5a9e;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 12px rgba(42, 90, 158, 0.3), inset 0 1px 0 rgba(106, 184, 255, 0.08);
        }

        :host([data-horizontal-snap="left"]) {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          border-left: none;
        }

        :host([data-horizontal-snap="right"]) {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
          border-right: none;
        }

        :host([data-vertical-snap="top"]) {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          border-top: none;
        }

        :host([data-vertical-snap="bottom"]) {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          border-bottom: none;
        }

        :host > * {
          box-sizing: border-box;
        }

        :host > thruster-controller:not(:last-child) {
          border-bottom: 1px solid #1a3a6e;
        }

        :host > thruster-controller:first-child {
          border-top-left-radius: inherit;
          border-top-right-radius: inherit;
        }

        :host > thruster-controller:last-child {
          border-bottom-left-radius: inherit;
          border-bottom-right-radius: inherit;
        }

        :host {
          overflow: hidden;
          transition: max-height 0.22s ease;
          max-height: 600px;
        }

        :host([data-collapsed]) {
          max-height: 24px;
        }
    `);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.dragged = false;

    this.shadowRoot.appendChild(UI.element("title-bar").setSource(this));
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
      this.dataset.horizontalSnap = "right";
      this.dataset.verticalSnap = "none";
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
