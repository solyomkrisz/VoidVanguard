export default class LocalSaveList extends LazyItemList {
  constructor() {
    super();
  }

  renderItem(item) {}
}

window.customElements.define("local-save-list", LocalSaveList);
