/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/validator/EmailInputValidator.js
 * Szerep: E-mail mezo kliensoldali formátumellenorzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import InputValidator from "/ui/component/form/InputValidator.js";

export default class EmailInputValidator extends InputValidator {
  constructor() {
    super();

    // Ez csak gyors kliensoldali formai ellenorzes; a szerver oldali validalas tovabbra is kotelezo.
    this.addRule({
      test: (v) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v),
      message: "Invalid email address",
    });
  }
}

window.customElements.define("email-input-validator", EmailInputValidator);
