import { el } from "/ui/UI.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";

export default class SaveListSlot extends BaseCustomElement {
  set data(value) {
    this._data = value;
    this.update();
  }

  get data() {
    return this._data;
  }

  constructor() {
    super([path.join(dir, "global.css"), path.join(dir, "saveListSlot.css")]);

    this._elements = {};
    this._built = false;
    this._data = null;

    this.onLoadSaveButtonClick = this.onLoadSaveButtonClick.bind(this);
  }

  connectedCallback() {
    this.build();
    this.update();
  }

  onLoadSaveButtonClick(e) {
    console.log(this.data.game_state);
  }

  build() {
    if (this._built) return;

    const elements = this._elements;

    elements.slotName = el("div", { class: "slot-name" });
    elements.createdAtDate = el("div", { class: "created-at" });
    elements.updatedAtDate = el("div", { class: "updated-at" });
    elements.loadSaveButton = el(
      "button",
      { onClick: this.onLoadSaveButtonClick },
      ["Mentés betöltése"],
    );

    this.appendShadowChild(elements.slotName);
    this.appendShadowChild(elements.createdAtDate);
    this.appendShadowChild(elements.updatedAtDate);
    this.appendShadowChild(elements.loadSaveButton);

    this._built = true;
  }

  update() {
    if (!this._built) return;

    const elements = this._elements;

    elements.slotName.textContent = this.data?.slot_name;
    elements.createdAtDate.textContent = this.data?.created_at;
    elements.updatedAtDate.textContent = this.data?.updated_at;
  }
}

window.customElements.define("save-list-slot", SaveListSlot);
