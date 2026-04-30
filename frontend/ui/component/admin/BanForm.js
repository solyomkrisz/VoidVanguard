// lekéri adott user-id attrib alapján a státuszt. ha nincs bannolva ban form megjelenítése, ha bannolva van akkor unban form
import { el } from "/ui/UI.js";
import * as net from "/common/network.js";
import ToastManager from "/ui/component/feedback/ToastManager.js";
import AppModal from "/ui/component/feedback/AppModal.js";

export default class BanForm extends HTMLElement {
  static get observedAttributes() {
    return ["user-id"];
  }

  get userId() {
    return this.getAttribute("user-id");
  }

  constructor() {
    super();

    this._modal = el("app-modal");
    this._pending = false;
    this._status = null;
    this._elements = {};
    this._built = false;

    this.onUnbanButtonClick = this.onUnbanButtonClick.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "user-id" && oldValue !== newValue) {
      if (newValue) {
        this.updateStatus();
      }
    }
  }

  async updateStatus() {
    if (!this.userId || this._pending) return;
    this._pending = true;

    const response = await net.send(
      "/api/admin/ban?targetUserId=" + this.userId,
    );

    if (!response?.success || !response?.result) {
      console.warn("Unable to get ban status");
      ToastManager.REQUEST(
        "Nem sikerült a felhasználó kitiltási állapotát lekérni",
      );
      this._pending = false;
      return;
    }

    this._pending = false;
    this._status = response.result;
    this.update();
  }

  async onUnbanButtonClick() {
    if (this._pending || !this.userId) return;
    this._pending = true;

    const result = await this._modal.open({
      title: "Kitiltás visszavonása",
      message: "Biztosan vissza szeretnéd vonni ezen felhasználó kitiltását?",
      confirmButtonText: "Igen",
      cancelButtonText: "Nem",
    });

    if (!result) {
      this._pending = false;
      return;
    }

    const formData = new FormData();
    formData.set("userId", this.userId);

    const response = await net.send("/api/admin/ban", {
      method: "DELETE",
      body: formData,
    });

    if (!response?.success) {
      console.warn("Unable to unban user.");
      ToastManager.REQUEST("Nem sikerült a felhasználó kitiltását visszavonni");
      this._pending = false;
      this.updateStatus();
      return;
    }

    ToastManager.REQUEST("Felhasználó kitiltása sikeresen visszavonva");
    this._pending = false;
    this.dispatchEvent(new CustomEvent("ban-changed", { bubbles: true, composed: true }));
    this.updateStatus();
  }

  async onSubmit(e) {
    e.preventDefault();

    if (this._pending || !this.userId) return;
    this._pending = true;

    const result = await this._modal.open({
      title: "Kitiltás",
      message: "Biztos ki szeretnéd tiltani ezt a felhasználót?",
      confirmButtonText: "Igen",
      cancelButtonText: "Nem",
    });

    if (!result) {
      this._pending = false;
      return;
    }

    const formData = new FormData(this._elements.banForm);
    formData.set("userId", this.userId);

    const response = await net.send("/api/admin/ban", {
      method: "POST",
      body: formData,
    });

    if (!response?.success) {
      console.warn("Unable to ban user.");
      ToastManager.REQUEST("A felhasználó kitiltása sikertelen");
      this._pending = false;
      this.updateStatus();
      return;
    }

    ToastManager.REQUEST("A felhasználó sikeresen kitiltva");
    this._pending = false;
    this.dispatchEvent(new CustomEvent("ban-changed", { bubbles: true, composed: true }));
    this.updateStatus();
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    this._elements.unbanButton = el(
      "button",
      { onClick: this.onUnbanButtonClick },
      ["Kitiltás feloldása"],
    );
    this._elements.unbanFormContainer = el(
      "div",
      { class: "unban-form", hidden: true },
      [this._elements.unbanButton],
    );

    this._elements.banForm = el("form", { onSubmit: this.onSubmit }, [
      el("textarea", { name: "reason", placeholder: "Kitiltás oka" }),
      el("input", { type: "datetime-local", name: "expiresAt" }),
      el("button", {}, ["Kitiltás"]),
    ]);
    this._elements.banFormContainer = el("div", { class: "ban-form" }, [
      this._elements.banForm,
    ]);

    this.append(
      this._elements.unbanFormContainer,
      this._elements.banFormContainer,
    );

    this._built = true;
  }

  update() {
    if (!this._status || !this._built) return;

    if (this._status.is_banned) {
      this._elements.banFormContainer.hidden = true;
      this._elements.unbanFormContainer.hidden = false;
    } else {
      this._elements.banFormContainer.hidden = false;
      this._elements.unbanFormContainer.hidden = true;
    }
  }
}

window.customElements.define("ban-form", BanForm);
