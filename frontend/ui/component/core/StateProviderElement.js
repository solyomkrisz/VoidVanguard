import * as net from "/common/network.js";
import State from "/state/State.js";

export default class StateProviderElement extends HTMLElement {
  // with as you can name the remote state so inside a multistateprovider the elements can reference it
  static get observedAttributes() {
    return [
      "src",
      "as",
      "method",
      "src-prefix",
      "inherit",
      "disable-auto-update",
    ];
  }

  get src() {
    return this.getAttribute("src");
  }

  set src(value) {
    if (this.srcPrefix) {
      value = this.srcPrefix + value;
    }

    this.setAttribute("src", value);

    // if (!this.disableAutoUpdate) {
    //   this.load();
    // }
  }

  get as() {
    return this.getAttribute("as");
  }

  set as(value) {
    this.setAttribute("as", value);
  }

  get method() {
    return this.getAttribute("method");
  }

  set method(value) {
    this.setAttribute("method", value);
    this.load();
  }

  get srcPrefix() {
    return this.getAttribute("src-prefix");
  }

  set srcPrefix(value) {
    this.setAttribute("src-prefix", value);
    this.load();
  }

  get disableAutoUpdate() {
    return this.hasAttribute("disable-auto-update");
  }

  constructor() {
    super();

    this.states = new Map([["local", new State()]]);
    this.stateProviders = new Map();
    this.processed = new Set();
    this.unsubscribers = new Map();

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          const unsubscribe = this.unsubscribers.get(node);
          if (unsubscribe) {
            unsubscribe();
            this.unsubscribers.delete(node);
          }
        }

        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          requestAnimationFrame(() => {
            this.subscribeChild(node);
            [
              ...Array.from(this.querySelectorAll("[multistatesubscribe]")),
              ...Array.from(node.querySelectorAll("[subscribe-to]")),
              ...Array.from(node.querySelectorAll("[subscribe]")),
              ...Array.from(node.querySelectorAll("render-if")),
              ...Array.from(this.querySelectorAll("[state]")),
            ].forEach((child) => this.subscribeChild(child));
          });
        }
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // name === "src" && oldValue !== newValue && !this.disableAutoUpdate -> középső kiszedve, hogy a like dislike button frissülhessen
    if (name === "src" && !this.disableAutoUpdate) {
      this.load();
    }
  }

  async connectedCallback() {
    if (this._initialized) return;

    await this.collectSubstateProviders();
    this.subscribeChildren();
    this.processed.clear();
    this.observer.observe(this, { childList: true, subtree: true });

    this._initialized = true;
  }

  disconnectedCallback() {
    if (this.observer) this.observer.disconnect();

    if (this.unsubscribers) {
      this.unsubscribers.forEach((unsubscribe) => unsubscribe());
      this.unsubscribers.clear();
    }
  }

  async collectSubstateProviders() {
    await customElements.whenDefined("state-provider");

    for (const provider of Array.from(
      this.querySelectorAll("state-provider[as]"),
    )) {
      if (!provider.as) {
        continue;
      }

      // Ez akkor van használva ha a <state-provider> elem state-hubként viselkedik. Ez esetben azonban a gyerekek leiratkozási függvényének muszáj itt elmentve lennie, tehát a teljes provider-re semmi szükség, csak a state-jére
      this.states.set(provider.as, provider.states.get("local"));
      this.stateProviders.set(provider.as, provider);
    }
  }

  complexSubscribe(child, param) {
    if (!child?.subscribe) {
      queueMicrotask(() => child.subscribe?.(param));
    } else {
      child.subscribe(param);
    }
  }

  regularSubscribe(child, saveUnsubscribeFunction = true) {
    if (!child.matches?.("[subscribe-to]")) {
      return;
    }

    const unsubscribe = this.states
      .get("local")
      .sub(child.getAttribute("subscribe-to"), (_, value) => {
        const targetProperty =
          child.getAttribute("subscribe-with") || "textContent";

        // if (!value) return;

        if (targetProperty) {
          try {
            child[targetProperty] = value;
          } catch (_) {
            return;
          }
        }
      });

    if (saveUnsubscribeFunction) {
      this.unsubscribers.set(child, unsubscribe);
    } else {
      return unsubscribe;
    }
  }

  subscribeChild(child) {
    if (child.parentElement?.closest("state-provider") !== this) {
      return;
    }

    if (this.unsubscribers.has(child)) {
      return;
    }

    if (this.processed.has(child)) {
      return;
    }

    this.processed.add(child);

    // Nem kell elmenteni az összes leiratkozási függvényt, hisz multistatesubscribe-ot csak custom elem használhat, és ő majd leiratkozik magának a disconnectedCallback függvényében
    if (child.matches?.("[multistatesubscribe]")) {
      this.complexSubscribe(child, this.states);
      return;
    }

    if (child.matches?.("[subscribe]") || child.matches?.("render-if")) {
      const requestedState = child.getAttribute("state");

      if (!requestedState) {
        this.complexSubscribe(child, this.states.get("local"));
      } else {
        this.complexSubscribe(child, this.states.get(requestedState));
      }

      return;
    }

    // Itt ez a <state-provider> state-hub-ként viselkedik tehát a gyerek aki a state attribútuma beállításával egy konkrét state-re iratkozik fel, nem gyereke annak a state elementnek tehát ennek a state-nek kell kezelnie a leiratkozási függvényeit, nem annak a state-nek amire feliratkozik. Ez azért kell mert a state-hubként viselkedő <state-provider> MutationObserver-e fogja detektálni a gyere eltávolítódását és a leiratkoztatása csak akkor lehetséges ha ide van elmentve a függvény

    // Egy nem custom elem gyerek feliratkozik egy adott state-re! Fontos hogy ennek az elemnek nincs subscribe függvénye így nem olvasztható egybe ez az if a fenti kettővel
    if (child.matches?.("[state]")) {
      // Az hogy itt a child-on subscribe-to vagy subscribe (custom elem komplexebb feliratkozási mechanizmussal) az adott state subscribeChild metódusa eldönti
      const requestedState = child.getAttribute("state");

      if (!requestedState) {
        return;
      }

      if (!this.stateProviders.has(requestedState)) {
        return;
      }

      const unsubscribe = this.stateProviders
        .get(requestedState)
        .regularSubscribe(child, false);
      this.unsubscribers.set(child, unsubscribe);

      return;
    }

    this.regularSubscribe(child);
  }

  subscribeChildren() {
    // Megeshet hogy egy elem többször van kiválasztva, erre van a this.processed Set()
    for (const child of [
      ...Array.from(this.querySelectorAll("[multistatesubscribe]")),
      ...Array.from(this.querySelectorAll("[subscribe-to]")),
      ...Array.from(this.querySelectorAll("[subscribe]")),
      ...Array.from(this.querySelectorAll("render-if")),
      ...Array.from(this.querySelectorAll("[state]")),
    ]) {
      this.subscribeChild(child);
    }
  }

  from(data) {
    this.states.get("local").from(data);
  }

  async load() {
    if (!this.src) return;

    try {
      const response = await net.send(this.src, {
        method: this.method || "GET",
      });

      if (response?.success) {
        this.states.get("local").from(response.result);
      }
    } catch (_) {
      return;
    }
  }

  onResponse(response) {
    if (!response || !response?.success) return;

    this.load();
  }

  refresh() {
    this.load();
  }
}

window.customElements.define("state-provider", StateProviderElement);
