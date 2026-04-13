import InputValidator from "/ui/component/form/InputValidator.js";

export default class DescriptionInputValidator extends InputValidator {
  constructor() {
    super();

    this.addRule({
      test: (v) => v.length <= 250,
      message: "Profile description cannot be longer than 250 characters",
    });
  }
}

window.customElements.define(
  "description-input-validator",
  DescriptionInputValidator,
);
