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
        --panel-width: min(92vw, 20rem);
        --panel-height: clamp(3.4rem, 9vh, 5rem);

        position: relative;
        z-index: 1001;
        left: auto;
        bottom: auto;
        transform: none;
        width: var(--panel-width);
        max-width: var(--panel-width);
        min-width: min(13.5rem, 100%);
        height: var(--panel-height);
        max-height: var(--panel-height);
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.5rem 0.6rem 0.55rem;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        background:
          linear-gradient(
            180deg,
            rgba(106, 184, 255, 0.12) 0%,
            rgba(106, 184, 255, 0) 22%
          ),
          linear-gradient(180deg, #202033 0%, #161624 100%);
        border: 2px solid #4a90e2;
        border-bottom: none;
        box-shadow:
          inset 0 0 0 1px #1a3a6e,
          0 -6px 18px rgba(6, 10, 18, 0.72);
        color: #cbe9ff;
        font-family: "Jersey", "Courier New", monospace;
        box-sizing: border-box;
        overflow: hidden;
        transition: height 0.22s ease, max-height 0.22s ease, padding 0.22s ease;
      }

      :host(.docked) {
        height: 24px;
        max-height: 24px;
        padding: 0 0.55rem;
        align-items: flex-start;
      }

      :host(.docked) .content {
        opacity: 0;
        pointer-events: none;
      }

      .content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        width: 100%;
        height: 100%;
        min-width: 0;
        transition: opacity 0.15s ease;
      }

      .dock-btn {
        position: absolute;
        top: 3px;
        right: 5px;
        width: 20px;
        height: 16px;
        background: linear-gradient(
          180deg,
          rgba(84, 150, 220, 0.98) 0%,
          rgba(52, 112, 182, 0.98) 100%
        );
        border: 1px solid rgba(123, 214, 255, 0.85);
        border-radius: 3px;
        padding: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #f5fbff;
        flex-shrink: 0;
        z-index: 2;
        box-shadow:
          inset 0 0 0 1px rgba(14, 28, 44, 0.95),
          0 2px 0 0 rgba(26, 61, 104, 0.95);
        transition: transform 0.2s ease, filter 0.12s ease;
      }

      .dock-btn:hover {
        filter: brightness(1.1);
      }

      .dock-btn:active {
        transform: translateY(1px);
      }

      .dock-btn:focus-visible {
        outline: 2px solid #9fd5ff;
        outline-offset: 1px;
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

      @media (max-width: 900px), (hover: none) and (pointer: coarse) {
        :host {
          --panel-width: min(62vw, 14rem);
          --panel-height: clamp(2.8rem, 9.5vw, 4rem);
          min-width: 0;
          gap: 0.45rem;
          padding: 0.38rem 0.45rem 0.45rem;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }

        :host(.docked) {
          height: 21px;
          max-height: 21px;
          padding: 0 0.45rem;
        }
      }

      @media (max-width: 560px), (max-height: 560px) {
        :host {
          --panel-width: min(56vw, 11.8rem);
          --panel-height: clamp(2.45rem, 8.5vw, 3.2rem);
        }
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
      dockBtn.blur();
    });
    this.shadowRoot.appendChild(dockBtn);

    const content = document.createElement("div");
    content.className = "content";

    this.statusDiagram.style.flex = "1 1 auto";
    this.statusDiagram.style.width = "100%";
    this.statusDiagram.style.minWidth = "0";
    this.statusDiagram.style.height = "100%";
    this.statusDiagram.style.maxHeight = "100%";
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
