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
  static get observedAttributes() {
    return ["src"];
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
            if (node.matches?.("[subscribe-to]")) {
              this.subscribeChild(node, this.state);
            } else if (node.matches?.("[subscribe]")) {
              node.subscribe?.(this.state);
            }

            node.querySelectorAll("[subscribe-to]").forEach((child) => {
              this.subscribeChild(child, this.state);
            });

            node.querySelectorAll("[subscribe]").forEach((child) => {
              child.subscribe?.(this.state);
            });
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

  subscribeChild(element) {
    const toHide = getElementToHide(element);

    const unsubscribe = this.state.sub(
      element.getAttribute("subscribe-to"),
      (_, value) => {
        const targetProperty = element.getAttribute("subscribe-with");
        const reversedBehaviour = element.hasAttribute("reversed-behaviour");

        if (value !== undefined) toHide.hidden = reversedBehaviour;
        else {
          toHide.hidden = !reversedBehaviour;
          return;
        }

        if (targetProperty) {
          try {
            element[targetProperty] = value;
          } catch (_) {
            return;
          }
        }
      },
    );

    this.unsubscribers.set(element, unsubscribe);
  }

  subscribeChildren() {
    for (const child of Array.from(this.querySelectorAll("[subscribe-to]"))) {
      if (this.unsubscribers.has(child)) {
        continue;
      }

      this.subscribeChild(child);
    }

    for (const child of Array.from(this.querySelectorAll("[subscribe]"))) {
      if (this.unsubscribers.has(child)) {
        continue;
      }

      queueMicrotask(() => child.subscribe?.(this.state));
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
