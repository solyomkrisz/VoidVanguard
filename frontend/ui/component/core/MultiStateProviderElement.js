export default class MultiStateProviderElement extends HTMLElement {
  constructor() {
    super();

    this.states = new Map();

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.as && this.states.has(node.as)) {
            this.states.delete(node.as);
          }
        }

        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          requestAnimationFrame(() => {
            if (node.matches?.("[as]")) {
              this.states.set(node.as, node);
            }

            if (node.matches?.("[state]")) {
              const requestedState = node.getAttribute("state");

              if (requestedState) return;

              if (this.states.has(requestedState)) {
                this.states.get(requestedState).subscribeChild(node);
              }

              Array.from(node.querySelectorAll("[state]")).forEach((child) => {
                const requestedState = child.getAttribute("state");

                if (requestedState) return;

                if (this.states.has(requestedState)) {
                  this.states.get(requestedState).subscribeChild(child);
                }
              });
            }
          });
        }
      }
    });
  }

  async connectedCallback() {
    if (this._initialized) return;

    await this.collectStateProviders();
    this.subscribeChildren();

    this._initialized = true;
  }

  disconnectedCallback() {
    if (this.observer) this.observer.disconnect();
  }

  async collectStateProviders() {
    if (!customElements.get("remote-state-provider")) {
      await customElements.whenDefined("remote-state-provider");
    }

    for (const provider of Array.from(
      this.querySelectorAll("remote-state-provider"),
    )) {
      if (!provider.as) {
        continue;
      }

      this.states.set(provider.as, provider);
    }
  }

  subscribeChild(child) {
    if (child.matches?.("[state]")) {
      // Az hogy itt a child-on subscribe-to vagy subscribe (custom elem komplexebb feliratkozási mechanizmussal) az adott state subscribeChild metódusa eldönti
      const requestedState = child.getAttribute("state");

      if (!requestedState) {
        return;
      }

      this.states.get(requestedState).subscribeChild(child);

      return;
    }

    // Ha több state-re iratkozik fel
    if (!child.matches?.("[multistatesubscribe]")) {
      return;
    }

    if (!child?.subscribe) {
      queueMicrotask(() => child.subscribe?.(this.states));
    } else {
      child.subscribe(this.states);
    }
  }

  // Ha egy konkrét state-re akarsz feliratkozni: <div state="stateNeve"></div>
  // Ha több state-re: <div multistatesubscribe></div> ez esetben muszáj hogy az elem custom legyen és ilyenkor az egész this.state be lesz adva az elem subscribe metódusának. Fontos hogy ilyenkor ne legyen rajta state attribútum
  subscribeChildren() {
    for (const child of [
      ...Array.from(this.querySelectorAll("[state]")),
      ...Array.from(this.querySelectorAll("[multistatesubscribe]")),
    ]) {
      this.subscribeChild(child);
    }
  }
}

window.customElements.define("multi-state-provider", MultiStateProviderElement);
