import { el } from "/ui/UI.js";
import { on, off } from "/common/eventhub.js";
import "/ui/component/game/RemoteSaveList.js";
import "/ui/component/game/LocalSaveList.js";
import "/ui/component/game/SaveForm.js";
import { isLoggedIn } from "/common/common.js";

export default class SaveMenu extends HTMLElement {
  get withForm() {
    return this.hasAttribute("with-form");
  }

  get remoteSaveListControls() {
    return this.getAttribute("remote-save-list-controls");
  }

  constructor() {
    super();

    this._built = false;
    this._elements = {};

    this._selectedSlot = null;

    this.onSaveRequest = this.onSaveRequest.bind(this);
    this.onSlotSelectVerificationRequest =
      this.onSlotSelectVerificationRequest.bind(this);
    this.onSaveSuccess = this.onSaveSuccess.bind(this);
    this.onSaveFailure = this.onSaveFailure.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  onSaveRequest(e) {
    e.stopPropagation();

    const formData = e?.detail?.formData;
    if (!formData) return;

    if (this._selectedSlot) {
      formData.set("save_id", this._selectedSlot.slotData.id); // <save-form>-ban van egy input name="save_id" így ha itt append-et használunk és az input üres volt, akkor formData.get("save_id") <empty-string> lesz és nem működik a PATCH
      e.detail.formData = formData;
    }

    this.parentElement.dispatchEvent(
      new CustomEvent("save-request", {
        detail: {
          ...e.detail,
          formData,
        }, // megtartjuk a SaveForm által belerakott onDone függvényt
        bubbles: true,
        composed: true,
      }),
    );
  }

  removeCurrentSelection() {
    if (
      this._selectedSlot?.type === "remote" &&
      this._elements.remoteSaveSectionList
    ) {
      this._elements.remoteSaveSectionList.removeSelection(this._selectedSlot);
    } else if (
      this._selectedSlot?.type === "local" &&
      this._elements.localSaveSectionList
    ) {
    }

    this._selectedSlot = null;
  }

  onSlotSelectVerificationRequest(e) {
    e.stopPropagation();

    const slot = e?.detail?.slot;

    if (
      !slot ||
      typeof e?.detail?.removeSelection !== "function" ||
      typeof e?.detail?.addSelection !== "function"
    )
      return;

    // Ha ugyan az mint a jelenleg kiválasztott leszedjük róla a jelölést
    if (
      slot.type === this._selectedSlot?.type &&
      slot.slotData.id === this._selectedSlot?.slotData?.id
    ) {
      this.removeCurrentSelection();

      if (this._elements.saveForm) {
        this._elements.saveForm.reset();
      }

      return;
    }

    this.removeCurrentSelection();

    this._selectedSlot = slot;
    e.detail.addSelection(this._selectedSlot);

    if (this._elements.saveForm) {
      this._elements.saveForm.from(this._selectedSlot.slotData);
    }
  }

  onSaveSuccess(e) {
    e.stopPropagation();
    this._elements?.remoteSaveSectionList?.reloadCurrentPage?.();
    this.removeCurrentSelection();
  }

  onSaveFailure(e) {
    e.stopPropagation();
  }

  onLogin(e) {
    this.createRemoteSaveSection();
  }

  onLogout(e) {
    this.createRemoteSaveSection();
  }

  connectedCallback() {
    this.build();

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  createSaveForm() {
    if (!this.withForm) return;

    const container = this._elements.formContainer;
    if (!container) return;

    container.textContent = "";
    container.hidden = false;

    const title = el("h1", {}, ["Jelenlegi állás mentése"]);
    this._elements.saveFormTitle = title;

    const saveForm = el("save-form");
    this._elements.saveForm = saveForm;

    container.appendChild(title);
    container.appendChild(saveForm);
  }

  createLocalSaveSection() {
    const container = this._elements.localSaveSectionContainer;
    if (!container) return;

    container.textContent = "";
    container.hidden = false;

    const title = el("h1", {}, ["Helyi mentések"]);
    this._elements.localSaveSectionTitle = title;

    const list = el("local-save-list", {
      local: true,
      controls: "pagination",
      "item-controls": this.remoteSaveListControls || "select delete",
      "selection-enabled": true,
    });
    this._elements.localSaveSectionList = list;

    container.appendChild(title);
    container.appendChild(list);
  }

  createRemoteSaveSection() {
    const container = this._elements.remoteSaveSectionContainer;
    if (!container) return;

    container.textContent = "";
    container.hidden = false;

    if (!isLoggedIn()) {
      const notification = el("h3", {}, [
        "A távoli mentések eléréséhez bejelentkezés szükséges",
      ]);
      this._elements.remoteSaveSectionNotification = notification;
      this.appendChild(notification);

      return;
    }

    const title = el("h1", {}, ["Távoli mentések"]);
    const list = el("remote-save-list", {
      src: "/api/saves",
      controls: "pagination",
      "item-controls": this.remoteSaveListControls || "select delete",
      "selection-enabled": true,
    });

    this._elements.remoteSaveSectionTitle = title;
    this._elements.remoteSaveSectionList = list;

    container.appendChild(title);
    container.appendChild(list);
  }

  build() {
    if (this._built) return;

    this._elements.formContainer = el("div", { hidden: true });
    this._elements.localSaveSectionContainer = el("div", { hidden: true });
    this._elements.remoteSaveSectionContainer = el("div", { hidden: true });

    this.appendChild(this._elements.formContainer);
    this.appendChild(el("hr"));

    this.appendChild(this._elements.localSaveSectionContainer);
    this.appendChild(el("hr"));

    this.appendChild(this._elements.remoteSaveSectionContainer);

    this.createSaveForm();
    this.createLocalSaveSection();
    this.createRemoteSaveSection();

    this.addEventListener("save-request", this.onSaveRequest);
    this.addEventListener("save-success", this.onSaveSuccess);
    this.addEventListener("save-failure", this.onSaveFailure);
    this.addEventListener(
      "slot-select-verification-request",
      this.onSlotSelectVerificationRequest,
    );

    this._built = true;
  }
}

window.customElements.define("save-menu", SaveMenu);
