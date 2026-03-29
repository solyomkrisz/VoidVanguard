export default class AdminModule extends HTMLElement {
  get targetId() {
    return this.getAttribute("target-id");
  }

  constructor() {
    super();

    this._built = false;
    this.onSignRequest = this.onSignRequest.bind(this);
  }

  connectedCallback() {
    this.build();
    console.log("AdminModule - connectedCallback");
    console.log(localStorage.getItem("access_token"));
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

    if (!this.targetId || !formData) {
      handler.onSignError?.();
      return;
    }

    formData.append("targetId", this.targetId);

    handler.onSignSuccess?.(formData);
  }
}

window.customElements.define("admin-module", AdminModule);
