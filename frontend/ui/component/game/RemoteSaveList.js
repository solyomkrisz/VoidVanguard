import ToastManager from "/ui/component/feedback/ToastManager.js";
import LazyItemList from "/ui/component/data/LazyItemList.js";
import "/ui/component/game/SaveListSlot.js";
import * as net from "/common/network.js";
import { el } from "/ui/UI.js";

export default class RemoteSaveList extends LazyItemList {
  get itemControls() {
    return this.getAttribute("item-controls");
  }

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
    this.onSaveSuccess = this.onSaveSuccess.bind(this);
    this.onSaveFailure = this.onSaveFailure.bind(this);
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
      this.reloadCurrentPage();
    }
  }

  toggleSelectedSlotHighlight(id) {
    if (this._selectedSlotData && this._selectedSlotData.id) {
      const element = this._byId.get(this._selectedSlotData.id);
      element && element?.toggleSelection();
    }
  }

  removeSelection() {
    this.toggleSelectedSlotHighlight();
    this._elements.saveForm.reset?.();
    this._selectedSlotData = null;
  }

  onSlotSelect(e) {
    e.stopPropagation();

    const slotData = e?.detail?.slotData;
    if (!slotData || !this.withForm || !this.selectionEnabled || !slotData?.id)
      return;

    // Ha ugyanaz az id levesszük a kiválasztást
    if (this._selectedSlotData?.id === slotData?.id) {
      this.removeSelection();
      return;
    }

    this.toggleSelectedSlotHighlight(); // leszedjük a régiről a kiválasztást
    this._selectedSlotData = slotData;
    this.toggleSelectedSlotHighlight(); // rárakjuk az újra

    if (!this._elements.saveForm) return;

    this._elements.saveForm.from?.(this._selectedSlotData);
  }

  onSaveSuccess(e) {
    e.stopPropagation();

    this._byId.clear();
    this.removeSelection(); // ha nem vesszük le akkor mentés után mivel újratölti az oldalt a kijelölés megmarad, de a this._selectedSlotData-ban még az id-ja a mentésenek benne marad, így ha kövinek kiválasztunk egy másik mentést, a régi (mentés előtti) id bejelölődik az újjal együtt
    this.reloadCurrentPage();
  }

  onSaveFailure(e) {
    e.stopPropagation();

    this.removeSelection();
  }

  connectedCallback() {
    if (!this._built && this.withForm) {
      this._elements.saveForm = this.appendChild(el("save-form"));
    }

    super.connectedCallback?.();

    this.addEventListener("save-delete", this.onSaveDelete);
    this.addEventListener("slot-select", this.onSlotSelect);
    this.addEventListener("save-success", this.onSaveSuccess);
    this.addEventListener("save-failure", this.onSaveFailure);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this.removeEventListener("save-delete", this.onSaveDelete);
    this.removeEventListener("slot-select", this.onSlotSelect);
    this.removeEventListener("save-success", this.onSaveSuccess);
    this.removeEventListener("save-failure", this.onSaveFailure);
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
