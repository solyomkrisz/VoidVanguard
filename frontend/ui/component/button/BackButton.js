/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/button/BackButton.js
 * Szerep: Egyszeru vissza gomb, amely modtol fuggoen elozo oldalra vagy a fooldalra visz.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export default class BackButton extends HTMLElement {
  get mode() {
    return this.getAttribute("mode");
  }

  constructor() {
    super();

    this._built = false;
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    const button = document.createElement("button");
    button.innerHTML = "&#8592; Vissza";
    button.id = "backBtn";
    this.appendChild(button);

    button.addEventListener("click", () => {
      // A to-previous mod csak akkor lep vissza, ha a bongeszo history-ban tenyleg van elozo oldal.
      if (this.mode === "to-previous" && window.history.length > 1) {
        window.history.back();
        return;
      }

      window.top.location.href = "/";
    });

    this._built = true;
  }
}

window.customElements.define("back-button", BackButton);
