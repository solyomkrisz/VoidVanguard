import BaseCustomElement from "./BaseCustomElement.js";

export default class ContextConsumerElement extends BaseCustomElement {
  static get observedAttributes() {
    return ["state-provider"];
  }

  get stateProvider() {
    return this.getAttribute("state-provider");
  }

  set stateProvider(value) {
    this.setAttribute("state-provider", value);
  }

  constructor(paths = []) {
    super(paths);
  }

  connect() {
    // let provider = this.closest(this.stateProvider);

    // if (!provider) {
    //   try {
    //     provider = this.getRootNode().host.closest(this.stateProvider);
    //   } catch (_) {
    //     return;
    //   }

    //   if (!provider) return;
    // }

    const provider = document.querySelector(this.stateProvider);

    if (!provider) return;

    if (provider.state) {
      this.subscribe(provider.state);
    } else {
      queueMicrotask(() => this.subscribe(provider.state));
    }
  }

  subscribe() {}
}
