import { el } from "/ui/UI.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";

export default class SaveListSlot extends BaseCustomElement {
  get interactive() {
    return this.hasAttribute("interactive");
  }

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
    this.onDelete = this.onDelete.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }

  connectedCallback() {
    this.build();
    this.update();
  }

  onLoadSaveButtonClick(e) {
    this.dispatchEvent(
      new CustomEvent("save-load-request", {
        detail: { gameState: this.data.game_state },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onDelete(e) {
    this.dispatchEvent(
      new CustomEvent("save-delete", {
        detail: { saveId: this.data.id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onSelect(e) {
    this.dispatchEvent(
      new CustomEvent("slot-select", {
        detail: { slotData: { id: this.data.id, name: this.data.slot_name } },
        bubbles: true,
        composed: true,
      }),
    );
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
    elements.deleteButton = el("button", { onClick: this.onDelete }, [
      "Mentés törlése",
    ]);

    this.appendShadowChild(elements.slotName);
    this.appendShadowChild(elements.createdAtDate);
    this.appendShadowChild(elements.updatedAtDate);

    this.appendShadowChild(elements.loadSaveButton);

    if (this.interactive) {
      elements.selectButton = el("button", { onClick: this.onSelect }, [
        "Módosítás",
      ]);
      this.appendShadowChild(elements.selectButton);
    }

    this.appendShadowChild(elements.deleteButton);

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
