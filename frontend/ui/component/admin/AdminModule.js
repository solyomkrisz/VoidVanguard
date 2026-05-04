export default class AdminModule extends HTMLElement {
  static get observedAttributes() {
    return ["target-user-id"];
  }

  get targetUserId() {
    return this.getAttribute("target-user-id");
  }

  constructor() {
    super();

    this._built = false;

    this.onSignRequest = this.onSignRequest.bind(this);
    this.onTargetUserChange = this.onTargetUserChange.bind(this);
  }

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

  onTargetUserChange(e) {
    const targetUserId = e?.detail?.targetUserId;
    if (!targetUserId) return;

    this.setAttribute("target-user-id", targetUserId);
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    this.addEventListener("sign-request", this.onSignRequest);
    this.addEventListener("target-user-change", this.onTargetUserChange);

    this._built = true;
  }

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
