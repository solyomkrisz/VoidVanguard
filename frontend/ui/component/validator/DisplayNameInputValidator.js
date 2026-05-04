import InputValidator from "/ui/component/form/InputValidator.js";

export default class DisplayNameInputValidator extends InputValidator {
  constructor() {
    super();

    this.addRule({
      test: (v) => v.length >= 1,
      message: "Display name must be at least 1 characters long",
    });
  }
}

if (!customElements.get("display-name-input-validator")) {
  customElements.define(
    "display-name-input-validator",
    DisplayNameInputValidator,
  );
}
