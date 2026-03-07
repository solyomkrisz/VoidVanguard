function getInputElement(type) {
  switch (type) {
    case "textarea":
      return type;
    case "select":
      return type;
    default:
      return "input";
  }
}

function isRegularInput(inputElement) {
  return inputElement === "input";
}

function createSelectInner(options) {
  let result = "";

  for (const [content, value] of options
    .substring(1, options.length - 1)
    .split("','")
    .map((e) => e.split("'-'"))) {
    result += `<option value="${value}">${content}</option>`;
  }

  return result;
}

export default class InputGroup extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      "input-type",
      "label",
      "input-placeholder",
      "input-name",
      "options",
    ];
  }

  get inputType() {
    return this.getAttribute("input-type");
  }

  set inputType(value) {
    this.setAttribute("input-type", value);
  }

  get label() {
    return this.getAttribute("label");
  }

  set label(value) {
    this.setAttribute("label", value);
  }

  get inputPlaceholder() {
    return this.getAttribute("input-placeholder");
  }

  set inputPlaceholder(value) {
    this.setAttribute("input-placeholder", value);
  }

  get options() {
    return this.getAttribute("options");
  }

  set options(value) {
    this.setAttribute("options", value);
  }

  get inputName() {
    return this.getAttribute("input-name");
  }

  set inputName(value) {
    this.setAttribute("input-name", value);
  }

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  connectedCallback() {
    if (this._initialized) return;
    this.build();
    this._initialized = true;
  }

  build() {
    const id = "input-" + crypto.randomUUID();
    const inputElement = getInputElement(this.inputType);

    this.innerHTML = `
      ${this.label ? `<label for="${id}">${this.label}</label>` : ""}
      <${inputElement}
        ${isRegularInput(inputElement) ? `type="${this.inputType}"` : ""}
        name="${this.inputName}"
        autocomplete="off"
        id="${id}"
        ${this.inputPlaceholder ? `placeholder="${this.inputPlaceholder}"` : ""}
      >${inputElement === "select" ? createSelectInner(this.options) : ""}</${inputElement}>
    `;

    this.querySelector(inputElement).addEventListener("input", (e) => {
      this.internals.setFormValue(e.currentTarget.value);
    });
  }
}

window.customElements.define("input-group", InputGroup);
