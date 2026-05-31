/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/game/SaveBrowserLauncher.js
 * Szerep: Mentesbongeszot megnyito inditoelem.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { on, off } from "/common/eventhub.js";
import { el } from "/ui/UI.js";
import { isLoggedIn } from "/common/common.js";

export default class SaveBrowserLauncher extends HTMLElement {
  constructor() {
    super();

    this._elements = {};
    this._built = false;

    this.onAuthChange = this.onAuthChange.bind(this);
  }

  onAuthChange(e) {
    this.update();
  }

  connectedCallback() {
    this.build();
    this.update();

    on("login", this.onAuthChange);
    on("logout", this.onAuthChange);
  }

  disconnectedCallback() {
    off("login", this.onAuthChange);
    off("logout", this.onAuthChange);
  }

  build() {
    if (this._built) return;

    this._elements.title = el("h1", {}, ["Játékmenet betöltése"]);
    this._elements.localSavesButton = el(
      "button",
      { "data-target": "local-save-menu" },
      ["Helyi mentések"],
    );
    this._elements.remoteSavesButton = el(
      "button",
      { "data-target": "remote-save-menu", hidden: true },
      ["Távoli mentések"],
    );
    this._elements.loginNotification = el("div", { hidden: true }, [
      "A távoli mentések funkció eléréséhez be kell jelentkeznie.",
    ]);

    this.appendChild(this._elements.title);
    this.appendChild(this._elements.localSavesButton);
    this.appendChild(this._elements.remoteSavesButton);
    this.appendChild(this._elements.loginNotification);

    this._built = true;
  }

  update() {
    if (!this._built) return;

    const loggedIn = isLoggedIn();

    this._elements.remoteSavesButton.hidden = !loggedIn;
    this._elements.loginNotification.hidden = loggedIn;
  }
}

window.customElements.define("save-browser-launcher", SaveBrowserLauncher);
