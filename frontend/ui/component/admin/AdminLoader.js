import { refreshAccessToken } from "/common/network.js";

export default class AdminLoader extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    try {
      const success = await refreshAccessToken();

      if (!success) {
        window.location.href = "/";
        return;
      }

      this.innerHTML =
        '<iframe src="/api/admin" frameborder="0" width="100%" height="100%"></iframe>';
    } catch {
      window.location.href = "/";
    }
  }

  disconnectedCallback() {
    this.innerHTML = "";
  }
}

window.customElements.define("admin-loader", AdminLoader);
