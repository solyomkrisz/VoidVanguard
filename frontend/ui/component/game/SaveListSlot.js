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

    this.onLoadSaveButtonClick = this.onLoadSaveButtonClick.bind(this);
    this.onDelete = this.onDelete.bind(this);
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
        detail: { save: { ...this.data } },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onDelete(e) {
    this.dispatchEvent(
      new CustomEvent("save-delete", {
        detail: { save: { ...this.data } },
        bubbles: true,
        composed: true,
      }),
    );
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

    elements.saveName = el("div", { class: "save-name" });
    elements.createdAtDate = el("div", { class: "created-at" });
    elements.updatedAtDate = el("div", { class: "updated-at" });

    this.appendShadowChild(elements.saveName);
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

    elements.saveName.textContent = this.data?.save_name;
    elements.createdAtDate.textContent = this.data?.created_at;
    elements.updatedAtDate.textContent = this.data?.updated_at;
  }
}

window.customElements.define("save-list-slot", SaveListSlot);
