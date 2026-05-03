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
