import { refreshAccessToken } from "/common/network.js";

export default class MePageLoader extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    try {
      const { success, refreshed } = await refreshAccessToken();

      if (!success) {
        window.location.href = "/";
        return;
      }

      this.innerHTML =
        '<iframe src="/api/me" frameborder="0" width="100%" height="100%"></iframe>';
    } catch {
      window.location.href = "/";
    }
  }

  disconnectedCallback() {
    this.innerHTML = "";
  }
}

window.customElements.define("me-page-loader", MePageLoader);
