import { debounce } from "/common/common.js";

export default class InputValidator extends HTMLElement {
  get for() {
    return this.getAttribute("for");
  }

  constructor() {
    super();

    this._rules = [];
    this._elements = {};
    this._built = false;

    this.onInput = this.onInput.bind(this);
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    let input;

    if (this.for) {
      input = document.querySelector(`#${this.for}`);
    } else {
      input = this.querySelector("input") || this.querySelector("textarea");
    }

    if (!input) {
      console.warn("Input not found");
    } else {
      this._elements.message = this.appendChild(document.createElement("div"));

      this._elements.input = input;

      input.addEventListener("input", debounce(this.onInput, 100));
    }

    this._built = true;
  }

  onInput() {
    const value = this._elements.input.value;
    this.validate(value);
  }

  validate(value) {
    this._elements.message.textContent = "";

    for (const rule of this._rules) {
      if (rule?.test(value)) {
        continue;
      }

      this.emitEvent("submit-disable");
      this.showMessage(rule.message);

      return;
    }

    this.emitEvent("submit-enable");
  }

  emitEvent(event) {
    this.dispatchEvent(
      new CustomEvent(event, {
        bubbles: true,
        composed: true,
      }),
    );
  }

  showMessage(message) {
    this._elements.message.textContent = message;
  }

  addRule(rule) {
    this._rules.push(rule);
  }
}

window.customElements.define("input-validator", InputValidator);
