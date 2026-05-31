/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/validator/DisplayNameInputValidator.js
 * Szerep: Megjelenitesi nev mezo kliensoldali ellenorzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
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
