import { debounce } from "/common/common.js";

export default class InputValidator extends HTMLElement {
  static RUN_ALL(container) {
    const validators = Array.from(
      container.querySelectorAll(".input-validator"),
    );

    for (const validator of validators) {
      const result = validator.onInput?.();

      if (!result) {
        return result;
      }
    }

    return true;
  }

  get disableOnInvalid() {
    return this.getAttribute("disable-on-invalid");
  }

  get validateImmediately() {
    return this.hasAttribute("validate-immediately");
  }

  get canBeEmpty() {
    return this.hasAttribute("can-be-empty");
  }

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
    this.classList.add("input-validator");
    this.build();

    if (this.validateImmediately) {
      this.onInput();
    }
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
    return this.validate(value);
  }

  handleNotification(valid = true) {
    if (this.disableOnInvalid) {
      const toDisable = document.querySelector(this.disableOnInvalid);
      if (toDisable) {
        toDisable.disabled = !valid;
      }
    } else {
      this.emitEvent(valid ? "submit-enable" : "submit-disable");
    }
  }

  validate(value) {
    this._elements.message.textContent = "";

    if (value === "" && this.canBeEmpty) {
      this.handleNotification(true);
      return true;
    }

    for (const rule of this._rules) {
      if (rule?.test(value)) {
        continue;
      }

      this.handleNotification(false);
      this.showMessage(rule.message);

      return false;
    }

    this.handleNotification(true);
    return true;
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

if (!customElements.get("input-validator")) {
  customElements.define("input-validator", InputValidator);
}
