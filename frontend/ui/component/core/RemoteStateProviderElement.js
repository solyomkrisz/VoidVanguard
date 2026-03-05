import * as net from "/common/network.js";
import State from "/state/State.js";

function getElementToHide(element) {
  const value = element.getAttribute("hide");

  if (!value) return element;

  switch (value) {
    case "parent":
      return element.parentElement;
    default:
      return document.querySelector(element.getAttribute("hide"));
  }
}

export default class RemoteStateProviderElement extends HTMLElement {
  // with as you can name the remote state so inside a multistateprovider the elements can reference it
  static get observedAttributes() {
    return ["src", "as"];
  }

  get src() {
    return this.getAttribute("src");
  }

  set src(value) {
    this.setAttribute("src", value);
    this.load();
  }

  constructor() {
    super();

    this.state = new State();
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
              ...Array.from(node.querySelectorAll("[subscribe-to]")),
              ...Array.from(node.querySelectorAll("[subscribe]")),
              ...Array.from(node.querySelectorAll("render-if")),
            ].forEach((child) => this.subscribeChild(child));
          });
        }
      }
    });
  }

  connectedCallback() {
    if (this._initialized) return;

    this.subscribeChildren();
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

  subscribeChild(child) {
    if (this.unsubscribers.has(child)) {
      return;
    }

    if (child.matches?.("[subscribe]")) {
      queueMicrotask(() => child.subscribe?.(this.state));
      return;
    }

    if (child.matches?.("render-if")) {
      queueMicrotask(() => child.subscribe?.(this.state));
      return;
    }

    if (!child.matches?.("[subscribe-to]")) {
      return;
    }

    const toHide = getElementToHide(child);

    const unsubscribe = this.state.sub(
      child.getAttribute("subscribe-to"),
      (_, value) => {
        const targetProperty = child.getAttribute("subscribe-with");
        const reversedBehaviour = child.hasAttribute("reversed-behaviour");

        if (value !== undefined) toHide.hidden = reversedBehaviour;
        else {
          toHide.hidden = !reversedBehaviour;
          return;
        }

        if (targetProperty) {
          try {
            child[targetProperty] = value;
          } catch (_) {
            return;
          }
        }
      },
    );

    this.unsubscribers.set(child, unsubscribe);
  }

  subscribeChildren() {
    for (const child of [
      ...Array.from(this.querySelectorAll("[subscribe-to]")),
      ...Array.from(this.querySelectorAll("[subscribe]")),
      ...Array.from(this.querySelectorAll("render-if")),
    ]) {
      this.subscribeChild(child);
    }
  }

  async load() {
    if (!this.src) return;

    try {
      const response = await net.send(this.src);

      if (response?.success) {
        this.state.from(response.result);
      }
    } catch {
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

window.customElements.define(
  "remote-state-provider",
  RemoteStateProviderElement,
);
