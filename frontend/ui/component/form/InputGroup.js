export default class InputGroup extends HTMLElement {
  constructor() {
    super();
    this._built = false;
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
  }

  build() {
    const label = this.querySelector("label");
    const input = this.querySelector("input, textarea, select");

    if (!input) return;

    let id = input.id;

    if (!id && label) {
      id = "input-" + crypto.randomUUID();
      input.id = id;
    }

    if (label) {
      label.setAttribute("for", id);
    }

    this._built = true;
  }
}

window.customElements.define("input-group", InputGroup);
