/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/game/GameControllerElement.js
 * Szerep: Egyetlen jatekvezerlo UI-elem.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";

export default class GameControllerElement extends BaseCustomElement {
  constructor(paths = []) {
    super(paths);
    this.onContextMenu = this.onContextMenu.bind(this);
  }

  onContextMenu(e) {
    e.preventDefault();
  }

  connectedCallback() {
    this.addEventListener("contextmenu", this.onContextMenu);
  }

  diconnectedCallback() {
    this.removeEventListener("contextmenu", this.onContextMenu);
  }
}
