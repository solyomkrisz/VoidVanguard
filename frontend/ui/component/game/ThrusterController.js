/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/game/ThrusterController.js
 * Szerep: Egy hajtomu vagy hajtomucsoport vezerloje.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import _ from "/ui/component/game/StatusDiagram.js";
import * as UI from "/ui/UI.js";

export default class ThrusterController extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
        :host {
          --row-height: clamp(2.6rem, 8.5vw, 3.3rem);
          --row-gap: clamp(0.3rem, 1.2vw, 0.55rem);
          --diagram-size: clamp(2rem, 7vw, 2.9rem);

          display: flex;
          align-items: center;
          gap: var(--row-gap);
          min-height: var(--row-height);
          padding: 0.32rem 0.5rem;
          color: #cbe9ff;
          font-family: "Jersey", "Courier New", monospace;
          cursor: pointer;
          user-select: none;
          box-sizing: border-box;
          background: rgba(19, 30, 46, 0.35);
          transition: background 0.15s ease, box-shadow 0.15s ease;
        }

        :host > * {
          box-sizing: border-box;
        }

        status-diagram {
          width: var(--diagram-size);
          min-width: var(--diagram-size);
          max-width: var(--diagram-size);
          height: var(--diagram-size);
          min-height: var(--diagram-size);
          max-height: var(--diagram-size);
          flex: 0 0 var(--diagram-size);
        }

        :host(:hover) {
          background: rgba(42, 90, 158, 0.25);
        }

        :host(.active) {
          background: rgba(50, 110, 60, 0.35);
          box-shadow:
            inset 0 0 0 1px rgba(80, 200, 100, 0.3),
            inset 0 0 0 2px rgba(26, 61, 104, 0.5);
        }

        .identificator {
          font-size: clamp(0.9rem, 2.7vw, 1.2rem);
          font-weight: 700;
          color: #c8e0ff;
          min-width: clamp(1.55rem, 4.5vw, 1.9rem);
          text-align: center;
          text-shadow: 0 0 6px rgba(106, 184, 255, 0.6);
          letter-spacing: 0.04em;
          flex: 0 0 auto;
        }

        @media (max-width: 900px), (hover: none) and (pointer: coarse) {
          :host {
            --row-height: clamp(2.2rem, 7.6vw, 2.9rem);
            --row-gap: clamp(0.22rem, 1vw, 0.42rem);
            --diagram-size: clamp(1.7rem, 6.2vw, 2.3rem);
            padding: 0.24rem 0.4rem;
          }
        }

        @media (max-width: 560px), (max-height: 560px) {
          :host {
            --row-height: clamp(1.95rem, 7vw, 2.45rem);
            --diagram-size: clamp(1.42rem, 5.7vw, 2rem);
          }
        }
    `);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.clicked = false;
    this.onToggleRequested = this.onToggleRequested.bind(this);

    this.gimbalDiagram = this.shadowRoot.appendChild(
      UI.element("status-diagram"),
    );
    this.throttleDiagram = this.shadowRoot.appendChild(
      UI.element("status-diagram"),
    );
  }

  setSource(source) {
    this.source = source;
    return this;
  }

  onToggleRequested() {
    if (!this.source) return;

    this.clicked = !this.clicked;
    this.classList.toggle("active", this.clicked);

    this.dispatchEvent(
      new CustomEvent("thruster-selection-change", {
        detail: {
          active: this.clicked,
          thruster: this.source,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  build() {
    if (!this.source) return;

    const id = this.shadowRoot.insertBefore(
      UI.element("div", UI.text(this.source.id)),
      this.gimbalDiagram,
    );
    id.classList.add("identificator");

    this.addEventListener("click", this.onToggleRequested);
  }

  disconnectedCallback() {
    this.clicked = false;
    this.removeEventListener("click", this.onToggleRequested);
  }
}

window.customElements.define("thruster-controller", ThrusterController);
