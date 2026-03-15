export default class InputGroup extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (this._initialized) return;
    this.build();
    this._initialized = true;
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

    const wrapper = document.createElement("div");

    wrapper.append(...this.children);

    for (const { name, value } of this.attributes) {
      wrapper.setAttribute(name, value);
    }

    this.replaceWith(wrapper);
  }
}

window.customElements.define("input-group", InputGroup);
