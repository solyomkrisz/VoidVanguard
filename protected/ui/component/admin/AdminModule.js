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
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "target-user-id" && oldValue !== newValue) {
      const nodes = Array.from(this.querySelectorAll("[user-id]"));

      for (const node of nodes) {
        if (node.getAttribute("user-id") !== this.targetUserId) {
          node.setAttribute("user-id", this.targetUserId);
        }
      }
    }
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    this.addEventListener("sign-request", this.onSignRequest);

    this._built = true;
  }

  onSignRequest(e) {
    const handler = e.target;
    const formData = e.detail?.formData;

    if (!handler) return;

    if (!this.targetUserId || !formData) {
      handler.onSignError?.();
      return;
    }

    formData.append("targetUserId", this.targetUserId);

    handler.onSignSuccess?.(e.detail);
  }
}

window.customElements.define("admin-module", AdminModule);
