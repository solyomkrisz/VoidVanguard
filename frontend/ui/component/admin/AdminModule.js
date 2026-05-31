/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/admin/AdminModule.js
 * Szerep: Admin felulet fo osszefogo modulja.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export default class AdminModule extends HTMLElement {
  // Figyeli, melyik felhasznalo van epp celpontkent kivalasztva.
  static get observedAttributes() {
    return ["target-user-id"];
  }

  // Az aktualis admin-celpont user azonositoja attribute-bol jon.
  get targetUserId() {
    return this.getAttribute("target-user-id");
  }

  // Bekoti az admin-modul sajat esemenykezelőit.
  constructor() {
    super();

    this._built = false;

    this.onSignRequest = this.onSignRequest.bind(this);
    this.onTargetUserChange = this.onTargetUserChange.bind(this);
  }

  // Ha valtozik a cel user, tovabbszinkronizalja az azonositojat a belso child elemekre.
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "target-user-id" && oldValue !== newValue) {
      if (newValue) {
        const nodes = Array.from(this.querySelectorAll("[user-id]"));

        for (const node of nodes) {
          if (node.getAttribute("user-id") !== this.targetUserId) {
            node.setAttribute("user-id", this.targetUserId);
          }
        }
      } else {
        const nodes = Array.from(this.querySelectorAll("[user-id]"));

        for (const node of nodes) {
          if (node.getAttribute("user-id") !== this.targetUserId) {
            node.setAttribute("user-id", "");
          }
        }
      }

      document.querySelector("comment-section[admin]")?.partialRefresh();
    }
  }

  // Kivulrol erkezo cel-user valtozast attribute-kent is elment.
  onTargetUserChange(e) {
    const targetUserId = e?.detail?.targetUserId;
    if (!targetUserId) return;

    this.setAttribute("target-user-id", targetUserId);
  }

  // DOM-ba keruleskor egyszeri buildet ker.
  connectedCallback() {
    this.build();
  }

  // Felépiti az admin-modul esemenyhidjat a sign-requestekhez es target-user valtasokhoz.
  build() {
    if (this._built) return;

    this.addEventListener("sign-request", this.onSignRequest);
    this.addEventListener("target-user-change", this.onTargetUserChange);

    this._built = true;
  }

  // A gyerek komponensek sign-requestjeit egesziti ki a jelenleg kivalasztott target userrel.
  onSignRequest(e) {
    const handler = e.target;

    const formData = e.detail?.formData;
    const url = e.detail?.url;

    if (!handler) return;

    if (!this.targetUserId || !(formData || url)) {
      handler.onSignError?.({ ...e.detail, message: "Először válasszon ki egy felhasználót az Álcázás mint gombbal!" });
      return;
    }

    if (formData) {
      formData.append("targetUserId", this.targetUserId);
    } else if (url) {
      const u = new URL(url, window.location.origin);

      u.searchParams.set("targetUserId", this.targetUserId);
      e.detail.url = u.toString();
    }

    handler.onSignSuccess?.(e.detail);
  }
}

window.customElements.define("admin-module", AdminModule);
