import InputValidator from "/ui/component/form/InputValidator.js";

export default class EmailInputValidator extends InputValidator {
  constructor() {
    super();

    this.addRule({
      test: (v) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v),
      message: "Invalid email address",
    });
  }
}

window.customElements.define("email-input-validator", EmailInputValidator);
