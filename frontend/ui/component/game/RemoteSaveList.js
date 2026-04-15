export default class RemoteSaveList extends LazyItemList {
  constructor() {
    super();
  }

  renderItem(item) {}
}

window.customElements.define("remote-save-list", RemoteSaveList);
