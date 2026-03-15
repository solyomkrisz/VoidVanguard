export default class DropdownContainer extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (this._initialized) return;

    const toggles = this.querySelectorAll("[toggle]");
    const originalToggle =
      toggles.length > 1 ? this.querySelector("[original-toggle]") : toggles[0];

    const dropdown = this.querySelector("[dropdown]");

    for (const toggle of toggles) {
      toggle.addEventListener("click", () => {
        dropdown.hidden = !dropdown.hidden;

        if (this.hasAttribute("hide-toggle-when-active")) {
          originalToggle.hidden = !dropdown.hidden;
        }
      });
    }

    this._initialized = true;
  }
}

window.customElements.define("dropdown-container", DropdownContainer);
