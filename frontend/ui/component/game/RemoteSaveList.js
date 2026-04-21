import ToastManager from "/ui/component/feedback/ToastManager.js";
import LazyItemList from "/ui/component/data/LazyItemList.js";
import "/ui/component/game/SaveListSlot.js";
import * as net from "/common/network.js";
import { el } from "/ui/UI.js";
import { on, off } from "/common/eventhub.js";

export default class RemoteSaveList extends LazyItemList {
  get itemControls() {
    return this.getAttribute("item-controls");
  }

  constructor() {
    super();

    this._elements = {};
    this._byId = new Map();

    this.onSaveDelete = this.onSaveDelete.bind(this);
    this.onSlotSelect = this.onSlotSelect.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.removeSelection = this.removeSelection.bind(this);
    this.addSelection = this.addSelection.bind(this);
  }

  async onSaveDelete(e) {
    const saveId = e?.detail?.saveId;
    if (!saveId) return;

    const formData = new FormData();
    formData.append("saveId", saveId);

    const response = await net.send("/api/saves", {
      method: "DELETE",
      body: formData,
    });

    if (response?.message) {
      console.log(response.message);
      ToastManager.REQUEST(response.message);
    }

    if (!response?.success) {
      console.error("Unable to delete save.");
      ToastManager.REQUEST("Unable to delete save");

      return;
    }

    this._byId.get(saveId)?.remove?.();
    this._byId.delete(saveId);

    if (this.controls === "pagination") {
      this._byId.clear();
      this.reloadCurrentPage();
    }

    this.dispatchEvent(
      new CustomEvent("save-deleted", {
        detail: {
          saveId,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  toggleSelectedSlotHighlight(id) {
    const element = this._byId.get(id);
    element && element?.toggleSelection();
  }

  removeSelection(slot) {
    if (slot.type !== "remote") return;

    const element = this._byId.get(slot.slotData.id);
    element && element?.removeSelection();
  }

  addSelection(slot) {
    if (slot.type !== "remote") return;

    const element = this._byId.get(slot.slotData.id);
    element && element?.addSelection();
  }

  onSlotSelect(e) {
    e.stopPropagation();

    this.dispatchEvent(
      new CustomEvent("slot-select-verification-request", {
        detail: {
          slot: {
            slotData: e?.detail?.slotData,
            type: "remote",
          },
          removeSelection: this.removeSelection,
          addSelection: this.addSelection,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onLogin(e) {}

  onLogout(e) {}

  connectedCallback() {
    super.connectedCallback?.();

    this.addEventListener("save-delete", this.onSaveDelete);
    this.addEventListener("slot-select", this.onSlotSelect);

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this.removeEventListener("save-delete", this.onSaveDelete);
    this.removeEventListener("slot-select", this.onSlotSelect);

    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  renderItem(item) {
    const el = document.createElement("save-list-slot");

    el.data = item;
    if (this.itemControls) {
      el.setAttribute("controls", this.itemControls);
    }

    this._byId.set(item.id, el);

    return el;
  }

  extractItems(response) {
    return response?.result?.saves;
  }
}

window.customElements.define("remote-save-list", RemoteSaveList);
