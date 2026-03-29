import ActionButton from "/ui/component/button/ActionButton.js";

export default class FriendshipActionButton extends ActionButton {
  getEndpoint() {
    return "/api/friends";
  }

  getEventName() {
    return "friendship-status-change";
  }

  getStatusEndpoint() {
    return `/api/friends/${this.userId}?include=status`;
  }

  updateButtonText() {
    const button = this._elements.button;
    if (!button) return;

    switch (this.status) {
      case "accepted":
        button.textContent = "Barát eltávolítása";
        break;
      case "not-friends":
        button.textContent = "Barát hozzáadása";
        break;
      case "received":
        button.textContent = "Barátkérelem elfogadása";
        break;
      case "sent":
        button.textContent = "Barátkérelem törlése";
        break;
      default:
        button.textContent = "";
    }
  }

  getBehaviour() {
    switch (this.status) {
      case "not-friends":
        return "POST";
      case "received":
        return "PATCH";
      case "accepted":
      case "sent":
        return "DELETE";
      default:
        return null;
    }
  }
}

window.customElements.define(
  "friendship-action-button",
  FriendshipActionButton,
);
