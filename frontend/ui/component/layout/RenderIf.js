export default class RenderIf extends HTMLElement {
  static get observerdAttributes() {
    return ["when"];
  }

  constructor() {
    super();

    this._initialized = false;
    this.evaluateCondition = null;
  }

  connectedCallback() {
    if (this._initialized) return;

    if (this.when) {
      // ellenőrzés...
      this.removeAttribute("when");
    }

    this._initialized = true;
  }

  subscribe(state) {
    let shouldRender = false;

    try {
    } catch (_) {
      return;
    }

    this.removeAttribute("when");

    if (!shouldRender) {
      this.hidden = true;
    }
  }
}

window.customElements.define("render-if", RenderIf);
