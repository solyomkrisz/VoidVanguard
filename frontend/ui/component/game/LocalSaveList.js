import LazyItemList from "/ui/component/data/LazyItemList.js";
import "/ui/component/game/SaveListSlot.js";
import { formatDate } from "/common/common.js";

export default class LocalSaveList extends LazyItemList {
  get itemControls() {
    return this.getAttribute("item-controls");
  }

  constructor() {
    super();

    this._data = null;
    this.parseSaves();

    this._byId = new Map();

    this.onSaveDelete = this.onSaveDelete.bind(this);
    this.onSlotSelect = this.onSlotSelect.bind(this);
    this.removeSelection = this.removeSelection.bind(this);
    this.addSelection = this.addSelection.bind(this);
  }

  onSaveDelete(e) {
    const saveId = e?.detail?.saveId;
    if (!saveId) return;

    console.log(saveId, this._data);
    this._data.delete(saveId);

    window.localStorage.setItem("localSaves", JSON.stringify([...this._data]));

    this.parseSaves();
    this._byId.clear();
    this.reloadCurrentPage();
  }

  toggleSelectedSlotHighlight(id) {
    const element = this._byId.get(id);
    element && element?.toggleSelection();
  }

  removeSelection(slot) {
    if (slot.type !== "local") return;

    const element = this._byId.get(slot.slotData.id);
    element && element?.removeSelection();
  }

  addSelection(slot) {
    if (slot.type !== "local") return;

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
            type: "local",
          },
          removeSelection: this.removeSelection,
          addSelection: this.addSelection,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  connectedCallback() {
    super.connectedCallback?.();

    this.addEventListener("save-delete", this.onSaveDelete);
    this.addEventListener("slot-select", this.onSlotSelect);

    if (this._built) this.refresh();
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this.removeEventListener("save-delete", this.onSaveDelete);
    this.removeEventListener("slot-select", this.onSlotSelect);
  }

  parseSaves() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("localSaves"));
      let localSaves = new Map(Array.isArray(parsed) ? parsed : []);
      this._data = localSaves;
    } catch (error) {
      console.error("Unable to load local saves");
      this._data = new Map();
    }
  }

  extractItems(response) {
    return response?.result?.saves;
  }

  getResponse() {
    if (!this._data) {
      return {
        success: false,
        result: null,
        message: "No data",
      };
    }

    const limit = this.pageSize;
    const offset = (this._page - 1) * limit;

    const values = [...this._data.values()];
    const pageItems = values.slice(offset, offset + limit);

    return {
      success: true,
      result: {
        saves: pageItems,
        hasNext: offset + pageItems.length < values.length,
        page: this._page,
        total: values.length,
      },
      message: "Successfully retrieved page",
    };
  }

  renderItem(item) {
    const el = document.createElement("save-list-slot");

    el.data = {
      ...item,
      created_at: formatDate(item.created_at),
      updated_at: formatDate(item.updated_at),
    };
    if (this.itemControls) {
      el.setAttribute("controls", this.itemControls);
    }

    this._byId.set(item.id, el);

    return el;
  }
}

window.customElements.define("local-save-list", LocalSaveList);
