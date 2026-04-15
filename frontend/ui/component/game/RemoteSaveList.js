import LazyItemList from "/ui/component/data/LazyItemList.js";
import "/ui/component/game/SaveListSlot.js";

export default class RemoteSaveList extends LazyItemList {
  constructor() {
    super();
  }

  renderItem(item) {
    const el = document.createElement("save-list-slot");
    el.data = item;
    return el;
  }

  extractItems(response) {
    return response?.result?.saves;
  }
}

window.customElements.define("remote-save-list", RemoteSaveList);
