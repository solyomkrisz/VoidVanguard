/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/validator/DescriptionInputValidator.js
 * Szerep: Profilleiras mezo kliensoldali hosszusag-ellenorzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
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
