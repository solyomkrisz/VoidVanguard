/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/game/ExitButton.js
 * Szerep: Kilepes esemenyt kuldo egyszeru jatekvezerlo gomb.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { el } from "/ui/UI.js";

export default class ExitButton extends HTMLElement {
  constructor() {
    super();

    this._built = false;
    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    // Buborékoló custom event kell, hogy a szulo jatek UI barmelyik retegben el tudja kapni.
    this.dispatchEvent(
      new CustomEvent("exit-game", { bubbles: true, composed: true }),
    );
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    const button = el(
      "button",
      { "data-sfx": "click_1", onClick: this.onClick },
      ["Kilépés"],
    );
    this.appendChild(button);

    this._built = true;
  }
}

window.customElements.define("exit-button", ExitButton);
