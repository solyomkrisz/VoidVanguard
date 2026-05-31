/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/validator/PasswordInputValidator.js
 * Szerep: Jelszo mezo kliensoldali erossegellenorzese egymas utan futo szabalyokkal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import InputValidator from "/ui/component/form/InputValidator.js";

export default class PasswordInputValidator extends InputValidator {
  constructor() {
    super();

    // Szandekosan egyszeru, soros szabalylista: az InputValidator mindig az elso elbukott szabaly uzenetet mutatja.
    this.addRule({
      test: (v) => v.length >= 8,
      message: "Password must be at least 8 characters",
    });

    this.addRule({
      test: (v) => /[a-z]/.test(v),
      message: "Password must include a lowercase letter",
    });

    this.addRule({
      test: (v) => /[A-Z]/.test(v),
      message: "Password must include an uppercase letter",
    });

    this.addRule({
      test: (v) => /\d/.test(v),
      message: "Password must include a number",
    });

    this.addRule({
      test: (v) => /[!@#$%^&*]/.test(v),
      message: "Password must include a special character (!@#$%^&*)",
    });
  }
}

window.customElements.define(
  "password-input-validator",
  PasswordInputValidator,
);
