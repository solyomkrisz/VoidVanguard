import * as UI from "../UI.js";

export default class AutopilotToggle extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        display: flex;
        align-items: center;
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    const label = UI.element("label", UI.text("Autópilóta"));
    label.setAttribute("for", "autopilotToggle");
    this.shadowRoot.appendChild(label);

    const checkbox = UI.element("input");
    checkbox.id = "autopilotToggle";
    checkbox.type = "checkbox";

    checkbox.addEventListener("change", ({ target }) => {
      this.dispatchEvent(
        new CustomEvent("autopilot-toggle", {
          detail: {
            checked: target.checked,
          },
          bubbles: true,
          composed: true,
        }),
      );
    });

    this.shadowRoot.appendChild(checkbox);
  }
}

window.customElements.define("autopilot-toggle", AutopilotToggle);
