import * as UI from "/ui/UI.js";

export default class AutopilotToggle extends HTMLElement {
  constructor() {
    super();

    this.shadowDOM = this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        display: flex;
        align-items: center;
        gap: 0.5vmin;
        cursor: pointer;
        user-select: none;
      }
      label {
        cursor: pointer;
      }
      input[type="checkbox"] {
        accent-color: #4a90e2;
        width: 1.2vmin;
        height: 1.2vmin;
        cursor: pointer;
      }
    `);
    this.shadowDOM.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    const label = UI.element("label", UI.text("Autópilóta"));
    label.setAttribute("for", "autopilotToggle");
    this.shadowDOM.appendChild(label);

    const checkbox = UI.element("input");
    checkbox.id = "autopilotToggle";
    checkbox.type = "checkbox";

    checkbox.addEventListener("change", ({ target }) => {
      target.blur();
      this.dispatchEvent(
        new CustomEvent("autopilot-toggle", {
          detail: {
            checked: target.checked,
          },
          bubbles: true,
          composed: true,
        })
      );
    });

    this._checkbox = checkbox;
    this.shadowDOM.appendChild(checkbox);
  }

  setChecked(val) {
    if (!this._checkbox) return;
    this._checkbox.checked = val;
    this.dispatchEvent(
      new CustomEvent("autopilot-toggle", {
        detail: { checked: val },
        bubbles: true,
        composed: true,
      })
    );
  }
}

window.customElements.define("autopilot-toggle", AutopilotToggle);
