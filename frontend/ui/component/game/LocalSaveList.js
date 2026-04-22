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

    this._byGameId = new Map();

    this.onSaveDelete = this.onSaveDelete.bind(this);
  }

  onSaveDelete(e) {
    const gameId = e?.detail?.save?.game_id;
    if (!gameId) return;

    console.log(gameId, this._data);
    this._data.delete(gameId);

    window.localStorage.setItem("localSaves", JSON.stringify([...this._data]));

    this.parseSaves();
    this._byGameId.clear();
    this.reloadCurrentPage();
  }

  connectedCallback() {
    super.connectedCallback?.();

    this.addEventListener("save-delete", this.onSaveDelete);

    if (this._built) this.refresh();
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this.removeEventListener("save-delete", this.onSaveDelete);
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
    el.setAttribute("save-type", "local");

    this._byGameId.set(item.game_id, el);

    return el;
  }
}

window.customElements.define("local-save-list", LocalSaveList);
