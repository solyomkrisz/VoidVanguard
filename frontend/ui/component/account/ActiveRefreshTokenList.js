import LazyItemList from "/ui/component/data/LazyItemList.js";
import { isLoggedIn, isUserSet, logout } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import { el } from "/ui/UI.js";
import * as net from "/common/network.js";
import ToastManager from "/ui/component/feedback/ToastManager.js";
import AppModal from "/ui/component/feedback/AppModal.js";

function parseUserAgent(userAgent = "") {
  userAgent = userAgent.toLowerCase();

  let os = "Unknown";

  if (userAgent.includes("windows")) os = "Windows";
  else if (userAgent.includes("mac os")) os = "Mac";
  else if (userAgent.includes("iphone")) os = "iPhone";
  else if (userAgent.includes("ipad")) os = "iPad";
  else if (userAgent.includes("android")) os = "Android";
  else if (userAgent.includes("linux")) os = "Linux";

  let browser = "Unknown";

  if (userAgent.includes("chrome") && !userAgent.includes("edg"))
    browser = "Chrome";
  else if (userAgent.includes("safari") && !userAgent.includes("chrome"))
    browser = "Safari";
  else if (userAgent.includes("firefox")) browser = "Firefox";
  else if (userAgent.includes("edg")) browser = "Edge";

  return {
    os,
    browser,
    label: `${os} • ${browser}`,
  };
}

export default class ActiveRefreshTokenList extends LazyItemList {
  static get observedAttributes() {
    return [...super.observedAttributes, "user-id"];
  }

  constructor() {
    super();

    this._hasOngoingSessionDestroy = false;
    this._modal = el("app-modal");

    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onSessionDestroy = this.onSessionDestroy.bind(this);
  }

  buildContainer() {
    const thead = el("thead", {}, [
      el("tr", {}, [
        el("th"),
        el("th", {}, ["Azonosító"]),
        el("th", {}, ["Kezdeményezve"]),
        el("th", {}, ["Érvényes eddig"]),
        el("th", {}, ["Utoljára aktív"]),
        el("th"),
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

    if (name === "src" && oldValue !== newValue && newValue) {
      this.refresh();
    }

    if (name === "user-id" && oldValue !== newValue) {
      console.warn(
        `${name} changed from [${oldValue}] to [${newValue}] when this._built was`,
        this._built,
      );

      if (newValue) {
        this.setAttribute("src", `/api/tokens/active?targetUserId=${newValue}`);
        // this.refresh();
      } else {
        this.reset();
      }
    }
  }

  onLogin(e) {
    this.refresh();
  }

  onLogout(e) {
    this.refresh();
  }

  async onSessionDestroy(e) {
    const id = e?.detail?.id;
    if (!id || this._hasOngoingSessionDestroy || this._loading) return;
    this._hasOngoingSessionDestroy = true;

    const result = await this._modal.open({
      title: "Munkamenet felfüggesztése",
      message:
        "Biztosan fel szeretnéd függeszteni a kiválasztott munkamenetet?",
      confirmButtonText: "Igen",
      cancelButtonText: "Nem",
    });

    if (!result) {
      this._hasOngoingSessionDestroy = false;
      return;
    }

    let url = "/api/tokens/" + id;

    if (this.getAttribute("user-id")) {
      url += "?targetUserId=" + this.getAttribute("user-id");
    }

    const response = await net.send(url, { method: "DELETE" });

    if (!response?.success || !response?.result?.deleted) {
      ToastManager.REQUEST("Nem sikerült a kívánt munkamenet felfüggesztése.");
      this._hasOngoingSessionDestroy = false;
      return;
    }

    ToastManager.REQUEST("Munkamenet sikeresen felfüggesztve.");
    this._hasOngoingSessionDestroy = false;

    if (response?.result?.logout) {
      await logout();
      return;
    }

    this.partialRefresh();
  }

  connectedCallback() {
    super.connectedCallback?.();

    this.addEventListener("session-destroy", this.onSessionDestroy);

    on("login", this.onLogin);
    on("logout", this.onLogout);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    this.removeEventListener("session-destroy", this.onSessionDestroy);

    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  renderItem(item) {
    // dropdown tr
    const makeDetail = (label, value) =>
      el("div", { class: "dropdown-detail" }, [
        el("span", { class: "dropdown-detail-label" }, [label]),
        el("span", { class: "dropdown-detail-value" }, [value ?? "-"]),
      ]);

    const dropdownTr = el("tr", { class: "dropdown-tr", hidden: true }, [
      el("td", { colspan: "6" }, [
        makeDetail("IP cím", item.ip),
        makeDetail("Böngésző", parseUserAgent(item.user_agent).label),
      ]),
    ]);

    // normal main tr
    const tr = el("tr");

    const onButtonClick = () => {
      tr.dispatchEvent(
        new CustomEvent("session-destroy", {
          detail: { id: item.id },
          bubbles: true,
          composed: true,
        }),
      );
    };

    const onDetailsButtonClick = () => {
      dropdownTr.hidden = !dropdownTr.hidden;
    };

    const isCurrentMarkerTd = el(
      "td",
      { class: "current-marker-td", "data-label": "Aktív" },
      [
      el("div", { class: "is-current-marker", hidden: !item.current }),
      ],
    );
    const idTd = el("td", { class: "session-id-cell", "data-label": "Azonosító" }, [
      item.id,
    ]);
    const issuedAtTd = el("td", { "data-label": "Kezdeményezve" }, [
      item.issued_at,
    ]);
    const expiresAtTd = el("td", { "data-label": "Érvényes eddig" }, [
      item.expires_at,
    ]);
    const lastUsedAtTd = el("td", { "data-label": "Utoljára aktív" }, [
      item.last_used_at,
    ]);

    const revokeButton = el(
      "button",
      { class: "session-action-button session-action-button--revoke", onClick: onButtonClick },
      [
      "Munkamenet felfüggesztése",
      ],
    );
    const detailsButton = el(
      "button",
      { class: "session-action-button session-action-button--details", onClick: onDetailsButtonClick },
      ["Részletek"],
    );
    const buttonTd = el("td", { class: "session-controls", "data-label": "Műveletek" }, [
      revokeButton,
      detailsButton,
    ]);

    tr.append(
      isCurrentMarkerTd,
      idTd,
      issuedAtTd,
      expiresAtTd,
      lastUsedAtTd,
      buttonTd,
    );

    // final return value
    const fragment = document.createDocumentFragment();
    fragment.append(tr, dropdownTr);

    return fragment;
  }

  extractItems(response) {
    return response?.result?.tokens || [];
  }
}

window.customElements.define(
  "active-refresh-token-list",
  ActiveRefreshTokenList,
);
