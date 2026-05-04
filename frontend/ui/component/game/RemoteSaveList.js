import ToastManager from "/ui/component/feedback/ToastManager.js";
import LazyItemList from "/ui/component/data/LazyItemList.js";
import "/ui/component/game/SaveListSlot.js";
import * as net from "/common/network.js";
import { el } from "/ui/UI.js";
import { on, off } from "/common/eventhub.js";
import NetworkErrorHandler from "/common/NetworkErrorHandler.js";

export default class RemoteSaveList extends LazyItemList {
  get itemControls() {
    return this.getAttribute("item-controls");
  }

  constructor() {
    super();

    this._elements = {};
    this._byGameId = new Map();

    this.onSaveDelete = this.onSaveDelete.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  async onSaveDelete(e) {
    const gameId = e?.detail?.save?.game_id;
    if (!gameId) return;

    const formData = new FormData();
    formData.append("game_id", gameId);

    const response = await net.send("/api/saves", {
      method: "DELETE",
      body: formData,
    });

    if (
      NetworkErrorHandler.handle(response, {
        context: "RemoteSaveList.onSaveDelete",
      })
    ) {
      return;
    }

    if (response?.message) {
      ToastManager.REQUEST(response.message);
    }

    this._byGameId.get(gameId)?.remove?.();
    this._byGameId.delete(gameId);

    if (this.controls === "pagination") {
      this._byGameId.clear();
      this.reloadCurrentPage();
    }

    this.dispatchEvent(
      new CustomEvent("save-deleted", {
        detail: {
          gameId,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onLogin(e) {}

  onLogout(e) {}

  onGameSaved(e) {
    if (e?.detail?.saveType !== "remote") return;
    this._byGameId.clear();
    this.reloadCurrentPage();
  }

  connectedCallback() {
    super.connectedCallback?.();

    this.addEventListener("save-delete", this.onSaveDelete);
    this._onGameSaved = this.onGameSaved.bind(this);
    document.addEventListener("game-saved", this._onGameSaved);

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this.removeEventListener("save-delete", this.onSaveDelete);
    document.removeEventListener("game-saved", this._onGameSaved);

    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  renderItem(item) {
    const el = document.createElement("save-list-slot");

    el.data = item;
    if (this.itemControls) {
      el.setAttribute("controls", this.itemControls);
    }
    el.setAttribute("save-type", "remote");

    this._byGameId.set(item.game_id, el);

    return el;
  }

  extractItems(response) {
    return response?.result?.saves;
  }
}

window.customElements.define("remote-save-list", RemoteSaveList);
