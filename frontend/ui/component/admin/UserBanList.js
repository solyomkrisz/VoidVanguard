/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/admin/UserBanList.js
 * Szerep: Tiltott felhasznalok listaja feloldasi muveletekkel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import LazyItemList from "/ui/component/data/LazyItemList.js";
import { el } from "/ui/UI.js";

export default class UserBanList extends LazyItemList {
  static get observedAttributes() {
    return ["user-id"];
  }

  constructor() {
    super();
    this.onBanChanged = this.onBanChanged.bind(this);
  }

  connectedCallback() {
    super.connectedCallback?.();
    document.addEventListener("ban-changed", this.onBanChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    document.removeEventListener("ban-changed", this.onBanChanged);
  }

  onBanChanged() {
    this.partialRefresh();
  }

  buildContainer() {
    const thead = el("thead", {}, [
      el("tr", {}, [
        el("th", {}, ["Létrehozva"]),
        el("th", {}, ["Lejár"]),
        el("th", {}, ["Indok"]),
        el("th", {}, ["Visszavonva"]),
        el("th", {}, ["Létrehozó"]),
        el("th", {}, ["Visszavonó"]),
      ]),
    ]);

    const tbody = el("tbody");

    const table = el("table", {}, [thead, tbody]);

    this._container = tbody;

    this.appendChild(table);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // super.attributeChangedCallback?.(name, oldValue, newValue);

    if (!this._built) {
      this._deferredAttributes.set(name, newValue);
      return;
    }

    if (name === "user-id" && oldValue !== newValue) {
      console.warn(
        `${name} changed from [${oldValue}] to [${newValue}] when this._built was`,
        this._built,
      );

      if (newValue) {
        this.setAttribute("src", `/api/admin/bans?targetUserId=${newValue}`);
        this.refresh();
      } else {
        this.reset();
      }
    }
  }

  renderItem(item) {
    const tr = el("tr");

    const createdAtTd = el("td", {}, [this.formatDate(item.created_at)]);
    const expiresAtTd = el("td", {}, [this.formatDate(item.expires_at)]);
    const reasonTd = el("td", {}, [item.reason || "-"]);
    const revokedAtTd = el("td", {}, [this.formatDate(item.revoked_at)]);
    const createdByTd = el("td", {}, [item.created_by_name ?? "-"]);
    const revokedByTd = el("td", {}, [item.revoked_by_name ?? "-"]);

    tr.append(
      createdAtTd,
      expiresAtTd,
      reasonTd,
      revokedAtTd,
      createdByTd,
      revokedByTd,
    );

    return tr;
  }

  renderContent(items, response) {
    if (!Array.isArray(items)) return;

    if (this._page === 1 && items.length === 0) {
      this._container.textContent = "";

      const tr = el("tr", {}, [
        el("td", { class: "ban-list-empty", colspan: "6" }, [
          "Nincsenek megjeleníthető kitiltások.",
        ]),
      ]);

      this._container.appendChild(tr);
      return;
    }

    super.renderContent(items, response);
  }

  extractItems(response) {
    return response?.result?.bans || [];
  }

  formatDate(value) {
    if (!value) return "-";

    const normalized = String(value).replace(" ", "T");
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
}

window.customElements.define("user-ban-list", UserBanList);
