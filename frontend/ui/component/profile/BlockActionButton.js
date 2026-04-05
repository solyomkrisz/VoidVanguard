import ActionButton from "/ui/component/button/ActionButton.js";

export default class BlockActionButton extends ActionButton {
  getEndpoint() {
    return "/api/blocks";
  }

  getEventName() {
    return "block-status-change";
  }

  getStatusEndpoint() {
    return `/api/blocks/${this.userId}?include=status`;
  }

  updateButtonText() {
    const button = this._elements.button;
    if (!button) return;

    switch (this.status) {
      case "you-blocked":
      case "both-blocked":
        button.textContent = "Tiltás feloldása";
        break;
      default:
        button.textContent = "Felhasználó letiltása";
        break;
    }
  }

  getBehaviour() {
    switch (this.status) {
      case "you-blocked":
      case "both-blocked":
        return "DELETE";
      case "got-blocked":
      case "not-blocked":
        return "POST";
      default:
        return null;
    }
  }
}

window.customElements.define("block-action-button", BlockActionButton);
