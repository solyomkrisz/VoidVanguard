import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import { el, dir } from "/ui/UI.js";
import { path } from "/common/common.js";

const DEFAULT_CONFIG = {
  title: "Modal title",
  message: "Modal message",
  confirmButtonText: "Ok",
  cancelButtonText: "Mégse",
  onConfirm: () => console.warn("No action set for modal.confirm"),
  onCancel: () => console.warn("No action set for modal.cancel"),
};

export default class AppModal extends BaseCustomElement {
  set data(value) {
    this._data = {
      ...DEFAULT_CONFIG,
      ...value,
    };
    this.update();
  }

  get data() {
    return this._data;
  }

  constructor() {
    super([path.join(dir, "appModal.css")]);

    this._data = { ...DEFAULT_CONFIG };
    this._elements = {};
    this._built = false;

    this._isOpen = false;
    this._resolver = null;

    this.onConfirmButtonClick = this.onConfirmButtonClick.bind(this);
    this.onCancelButtonClick = this.onCancelButtonClick.bind(this);
  }

  connectedCallback() {
    this.build();
    this.update();
  }

  disconnectedCallback() {
    this._resolve(false);
  }

  onConfirmButtonClick() {
    const onConfirm = this.data.onConfirm ?? DEFAULT_CONFIG.onConfirm;
    onConfirm();

    this.dispatchEvent(
      new CustomEvent("modal-confirm", { composed: true, bubbles: true }),
    );

    this._resolve(true);
    this.close();
  }

  onCancelButtonClick() {
    const onCancel = this.data.onCancel ?? DEFAULT_CONFIG.onCancel;
    onCancel();

    this.dispatchEvent(
      new CustomEvent("modal-cancel", { composed: true, bubbles: true }),
    );

    this._resolve(false);
    this.close();
  }

  _resolve(value) {
    if (!this._isOpen) return;

    this._isOpen = false;

    if (this._resolver) {
      this._resolver(value);
      this._resolver = null;
    }
  }

  build() {
    if (this._built) return;

    this._elements.title = el("div", { class: "modal-title" }, ["Modal title"]);
    this._elements.message = el("div", { class: "modal-message" }, [
      "Modal message",
    ]);
    this._elements.confirmButton = el(
      "button",
      { class: "modal-confirm-button", onClick: this.onConfirmButtonClick },
      ["Ok"],
    );
    this._elements.cancelButton = el(
      "button",
      { class: "modal-cancel-button", onClick: this.onCancelButtonClick },
      ["Mégse"],
    );

    this.appendShadowChild(this._elements.title);
    this.appendShadowChild(this._elements.message);
    this.appendShadowChild(this._elements.confirmButton);
    this.appendShadowChild(this._elements.cancelButton);

    this._built = true;
  }

  open(config = {}) {
    if (this._isOpen) {
      console.warn("Modal already open");
      return Promise.resolve(false);
    }

    if (!this.isConnected) {
      document.body.appendChild(this);
    }

    this._isOpen = true;

    this.data = config;
    this.setAttribute("open", "");

    return new Promise((resolve) => {
      this._resolver = resolve;
    });
  }

  close() {
    this.removeAttribute("open");
    this._resolve(false);
    this.remove();
  }

  update() {
    if (!this._built) return;

    this._elements.title.textContent = this.data.title;
    this._elements.message.textContent = this.data.message;
    this._elements.confirmButton.textContent = this.data.confirmButtonText;
    this._elements.cancelButton.textContent = this.data.cancelButtonText;
  }
}

window.customElements.define("app-modal", AppModal);
