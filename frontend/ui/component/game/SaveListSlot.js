import { el } from "/ui/UI.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";

export default class SaveListSlot extends BaseCustomElement {
  get controlsConfig() {
    const value = this.getAttribute("controls");
    if (!value) return [];

    return value.trim().split(/\s+/); // ["accept", "delete", "block"]
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
    this._selected = false;

    this.onLoadSaveButtonClick = this.onLoadSaveButtonClick.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "controls" && oldValue !== newValue) {
      this.rebuild();
    }
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

  toggleSelection() {
    const selectButton = this._elements.selectButton;
    if (!this.controlsConfig.includes("select") || !selectButton) return;

    this._selected = !this._selected;

    if (this._selected) {
      this.classList.add("selected");
      this._elements.selectButton.textContent = "Kijelölés törlése";
    } else {
      this.classList.remove("selected");
      this._elements.selectButton.textContent = "Kijelölés";
    }
  }

  addSelection() {
    const selectButton = this._elements.selectButton;
    if (!this.controlsConfig.includes("select") || !selectButton) return;

    this._selected = true;

    this.classList.add("selected");
    this._elements.selectButton.textContent = "Kijelölés törlése";
  }

  removeSelection() {
    const selectButton = this._elements.selectButton;
    if (!this.controlsConfig.includes("select") || !selectButton) return;

    this._selected = false;

    this.classList.remove("selected");
    this._elements.selectButton.textContent = "Kijelölés";
  }

  generateControls(config, all = false) {
    if (this._built) return;

    const elements = this._elements;

    if (config.includes("load") || all) {
      elements.loadSaveButton = el(
        "button",
        { onClick: this.onLoadSaveButtonClick },
        ["Mentés betöltése"],
      );

      this.appendShadowChild(elements.loadSaveButton);
    }

    if (config.includes("select") || all) {
      elements.selectButton = el("button", { onClick: this.onSelect }, [
        "Kijelölés",
      ]);

      this.appendShadowChild(elements.selectButton);
    }

    if (config.includes("delete") || all) {
      elements.deleteButton = el("button", { onClick: this.onDelete }, [
        "Mentés törlése",
      ]);

      this.appendShadowChild(elements.deleteButton);
    }
  }

  build() {
    if (this._built) return;

    const elements = this._elements;

    elements.slotName = el("div", { class: "slot-name" });
    elements.createdAtDate = el("div", { class: "created-at" });
    elements.updatedAtDate = el("div", { class: "updated-at" });

    this.appendShadowChild(elements.slotName);
    this.appendShadowChild(elements.createdAtDate);
    this.appendShadowChild(elements.updatedAtDate);

    const controlsConfig = this.controlsConfig;
    this.generateControls(controlsConfig, controlsConfig.length ? false : true);

    this._built = true;
  }

  rebuild() {
    this.innerHTML = "";
    this._built = false;
    this.build();
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
