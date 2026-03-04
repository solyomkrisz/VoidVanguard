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

function findProvider(element, selector) {
  let current = element;

  while (current) {
    if (current.matches?.(selector)) {
      return current;
    }

    if (current.parentElement) {
      current = current.parentElement;
    } else {
      const root = current.getRootNode();
      current = root.host ?? null;
    }
  }

  return null;
}

export default class StateLinkElement extends HTMLElement {
  static get observedAttributes() {
    return ["state-provider"];
  }

  get stateProvider() {
    return this.getAttribute("state-provider");
  }

  set stateProvider(value) {
    this.setAttribute("state-provider", value);
  }

  constructor() {
    super();

    this.provider = null;
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
            if (!this.provider) return;

            if (node.matches?.("[subscribe-to]")) {
              this.subscribeChild(node, this.provider.state);
            } else {
              node.subscribe?.(this.provider.state);
            }

            node.querySelectorAll("*").forEach((child) => {
              if (child.matches?.("[subscribe-to]")) {
                this.subscribeChild(child, this.provider.state);
              } else {
                child.subscribe?.(this.provider.state);
              }
            });
          });
        }
      }
    });
  }

  connectedCallback() {
    if (this._initialized) return;

    this.connect();
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

  connect() {
    this.provider = findProvider(
      this,
      this.stateProvider || "remote-state-provider",
    );

    if (!this.provider) return;

    if (this.provider.state) {
      this.subscribeChildren(this.provider.state);
    } else {
      queueMicrotask(() => this.subscribeChildren(this.provider.state));
    }
  }

  subscribeChild(element, state) {
    const toHide = getElementToHide(element);

    const unsubscribe = state.sub(
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

  subscribeChildren(state) {
    for (const child of Array.from(this.querySelectorAll("*"))) {
      if (child.matches?.("[subscribe-to]") && !this.unsubscribers.has(child)) {
        this.subscribeChild(child, state);
      } else {
        queueMicrotask(() => child.subscribe?.(state));
      }
    }
  }
}

window.customElements.define("state-link", StateLinkElement);
