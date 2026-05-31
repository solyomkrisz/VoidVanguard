/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/game/SaveMenu.js
 * Szerep: Mentesi muveleteket osszefogo menu.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { el } from "/ui/UI.js";
import { on, off } from "/common/eventhub.js";
import "/ui/component/game/RemoteSaveList.js";
import "/ui/component/game/LocalSaveList.js";
import "/ui/component/game/SaveForm.js";
import { isLoggedIn } from "/common/common.js";

export default class SaveMenu extends HTMLElement {
  get remoteSaveListControls() {
    return this.getAttribute("remote-save-list-controls");
  }

  constructor() {
    super();

    this._built = false;
    this._elements = {};

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  onLogin(e) {
    this.createRemoteSaveSection();
  }

  onLogout(e) {
    this.createRemoteSaveSection();
  }

  connectedCallback() {
    if (this._built) {
      this.rebuild();
    }

    this.build();

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  createLocalSaveSection() {
    const container = this._elements.localSaveSectionContainer;
    if (!container) return;

    container.textContent = "";
    container.hidden = false;
    this._elements.localSaveSectionTitle = null;
    this._elements.localSaveSectionList = null;

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
    this._elements.remoteSaveSectionNotification = null;
    this._elements.remoteSaveSectionTitle = null;
    this._elements.remoteSaveSectionList = null;

    if (!isLoggedIn()) {
      const notification = el("h3", {}, [
        "A távoli mentések eléréséhez bejelentkezés szükséges",
      ]);
      this._elements.remoteSaveSectionNotification = notification;
      container.appendChild(notification);

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

    this._elements.localSaveSectionContainer = el("div", { hidden: true });
    this._elements.remoteSaveSectionContainer = el("div", { hidden: true });

    this.appendChild(this._elements.localSaveSectionContainer);
    this.appendChild(el("hr"));

    this.appendChild(this._elements.remoteSaveSectionContainer);

    this.createLocalSaveSection();
    this.createRemoteSaveSection();

    this._built = true;
  }

  rebuild() {
    this.createLocalSaveSection();
    this.createRemoteSaveSection();
  }
}

window.customElements.define("save-menu", SaveMenu);
