export default class RenderIf extends HTMLElement {
  static get observedAttributes() {
    return ["when"];
  }

  get when() {
    return this.getAttribute("when");
  }

  set when(value) {
    this.setAttribute("when", value);
  }

  constructor() {
    super();

    this._initialized = false;
    this.evaluateCondition = null;
    this.unsubscribe = null;
    this.state = null;
  }

  connectedCallback() {
    if (this._initialized) return;

    if (this.when && !this.evaluateCondition) {
      this.compile();
    }

    this._initialized = true;
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // attributeChangedCallback(name, oldValue, newValue) {
  //   if (name === "when" && oldValue !== newValue) {
  //     this.compile();
  //   }
  // }

  compile() {
    try {
      this.evaluateCondition = new Function(
        "state",
        `with (state) { return ${this.when} }`,
      );

      if (this.state) {
        this.evaluate(this.state);
      }
    } catch (_) {
      this.evaluateCondition = null;
    }
  }

  evaluate(state) {
    if (!this.evaluateCondition || !state) return;

    let shouldRender = false;

    try {
      shouldRender = !!this.evaluateCondition(state);
    } catch (_) {
      shouldRender = false;
    }

    this.hidden = !shouldRender;
  }

  subscribeSingle(state) {
    this.state = state;

    this.unsubscribe = state.subscribeForAny((simpleState) => {
      this.evaluate(simpleState);
    });
  }
}

window.customElements.define("render-if", RenderIf);
