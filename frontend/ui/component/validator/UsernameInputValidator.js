import InputValidator from "/ui/component/form/InputValidator.js";

export default class UsernameInputValidator extends InputValidator {
  constructor() {
    super();

    const normalize = (v) => (v ?? "").trim();

    this.addRule({
      test: (v) => normalize(v).length > 0,
      message:
        "A felhasználónév nem lehet üres, vagy nem állhat csak SPACE karakterekből",
    });

    this.addRule({
      test: (v) => {
        const value = normalize(v);
        return value.length >= 3 && value.length <= 20;
      },
      message:
        "A felhasználónévnek 3 és 20 karakteres hosszúság között kell lennie",
    });

    this.addRule({
      test: (v) => /^[a-zA-Z0-9_]+$/.test(normalize(v)),
      message:
        "A felhasználó csak egy szó lehet és csak betűket számokat és alulvonást tartalmazhat",
    });
  }
}

window.customElements.define(
  "username-input-validator",
  UsernameInputValidator,
);
