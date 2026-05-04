import * as UI from "/ui/UI.js";
import _ from "/ui/component/game/AutopilotToggle.js";
import _1 from "/ui/component/game/StatusDiagram.js";

export default class FlightComputer extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.attachShadow({ mode: "open" });

    this._docked = false;

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
        background: #1a1a28;
        border: 2px solid #2a5a9e;
        border-bottom: none;
        box-shadow: 0 -4px 16px rgba(42, 90, 158, 0.4), inset 0 1px 0 rgba(106, 184, 255, 0.1);
        color: #6ab8ff;
        font-family: 'Courier New', monospace;
        box-sizing: border-box;
        overflow: hidden;
        transition: max-height 0.22s ease, padding 0.22s ease;
      }

      :host(.docked) {
        max-height: 22px;
        padding: 0 10px;
        align-items: flex-start;
      }

      :host(.docked) .content {
        opacity: 0;
        pointer-events: none;
      }

      .content {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        height: 100%;
        min-width: 0;
        transition: opacity 0.15s ease;
      }

      .dock-btn {
        position: absolute;
        top: 4px;
        right: 6px;
        width: 18px;
        height: 14px;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #4a90e2;
        flex-shrink: 0;
        z-index: 1;
        transition: color 0.12s ease, transform 0.22s ease;
      }

      .dock-btn:hover {
        color: #9fd5ff;
      }

      :host(.docked) .dock-btn {
        transform: rotate(180deg);
        top: 4px;
      }

      .dock-btn svg {
        width: 12px;
        height: 8px;
        display: block;
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

    const dockBtn = document.createElement("button");
    dockBtn.className = "dock-btn";
    dockBtn.title = "Dock / Undock";
    dockBtn.innerHTML = `<svg viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="1,1 6,7 11,1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    dockBtn.addEventListener("click", () => {
      this._docked = !this._docked;
      this.classList.toggle("docked", this._docked);
    });
    this.shadowRoot.appendChild(dockBtn);

    const content = document.createElement("div");
    content.className = "content";

    this.statusDiagram.style.flex = "1";
    this.statusDiagram.style.height = "100%";
    content.appendChild(this.statusDiagram);

    this._autopilotToggle = UI.element("autopilot-toggle");
    content.appendChild(this._autopilotToggle);

    this.shadowRoot.appendChild(content);

    this.addEventListener("autopilot-toggle", (e) => {
      if (e.detail.checked)
        this.source.updatePropulsion = this.source.autoPropulsionUpdate;
      else this.source.updatePropulsion = this.source.manualPropulsionUpdate;
    });
  }

  setAutopilot(val) {
    this._autopilotToggle?.setChecked(val);
  }
}

window.customElements.define("flight-computer", FlightComputer);
