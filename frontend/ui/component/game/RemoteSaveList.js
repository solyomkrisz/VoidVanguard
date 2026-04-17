import LazyItemList from "/ui/component/data/LazyItemList.js";
import "/ui/component/game/SaveListSlot.js";
import * as net from "/common/network.js";
import { el } from "/ui/UI.js";

export default class RemoteSaveList extends LazyItemList {
  get selectionEnabled() {
    return this.hasAttribute("selection-enabled");
  }

  get withForm() {
    return this.hasAttribute("with-form");
  }

  constructor() {
    super();

    this._elements = {};
    this._byId = new Map();
    this._selectedSlotData = null;

    this.onSaveDelete = this.onSaveDelete.bind(this);
    this.onSlotSelect = this.onSlotSelect.bind(this);
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
    }

    if (!response?.success) {
      console.error("Unable to delete save.");
      return;
    }

    this._byId.get(saveId)?.remove?.();
    this._byId.delete(saveId);

    if (this.controls === "pagination") {
      this.reloadCurrentPage();
    }
  }

  onSlotSelect(e) {
    e.stopPropagation();

    const slotData = e?.detail?.slotData;
    if (!slotData || !this.withForm || !this.selectionEnabled) return;

    this._selectedSlotData = slotData;

    if (!this._elements.saveForm) return;

    this._elements.saveForm.from?.(this._selectedSlotData);
  }

  connectedCallback() {
    if (!this._built && this.withForm) {
      this._elements.saveForm = this.appendChild(el("save-form"));
    }

    super.connectedCallback?.();

    this.addEventListener("save-delete", this.onSaveDelete);
    this.addEventListener("slot-select", this.onSlotSelect);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this.removeEventListener("save-delete", this.onSaveDelete);
    this.removeEventListener("slot-select", this.onSlotSelect);
  }

  renderItem(item) {
    const el = document.createElement("save-list-slot");

    el.data = item;
    if (this.selectionEnabled) {
      el.setAttribute("interactive", "");
    }

    this._byId.set(item.id, el);

    return el;
  }

  extractItems(response) {
    return response?.result?.saves;
  }
}

window.customElements.define("remote-save-list", RemoteSaveList);
