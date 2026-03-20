function toCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/-+([a-z])/g, (_, char) => char.toUpperCase());
}

export default function define(config = {}) {
  //#region destructurize
  const {
    is,
    super: Base = HTMLElement,
    created,
    connected,
    disconnected,
    attributeChanged,
    properties = {},
    ...custom
  } = config;

  if (!is) {
    console.warn("Couldn't define custom element: no name is provided.");
    return;
  }

  class CustomElement extends Base {
    constructor() {
      super();

      this._bindings = new WeakMap();

      if (typeof created === "function") {
        created.call(this);
      }
    }

    scoutBindings() {}

    connectedCallback() {
      super.connectedCallback?.(this);

      if (typeof connected === "function") {
        connected.call(this);
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback?.(this);

      if (typeof disconnected === "function") {
        disconnected.call(this);
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      super.attributeChangedCallback?.(name, oldValue, newValue);

      if (properties[name]?.notify && oldValue != newValue) {
        this.dispatchEvent(
          new CustomEvent(`${name}-changed`, {
            detail: {
              old: oldValue,
              new: newValue,
            },
            bubbles: true,
            composed: true,
          }),
        );
      }

      if (typeof attributeChanged === "function") {
        attributeChanged.call(this, name, oldValue, newValue);
      }

      if (typeof properties[name]?.change === "function") {
        properties[name].change.call(this, oldValue, newValue);
      }
    }
  }

  //#region define observedAttributes
  const observedAttributes = [
    ...new Set([
      ...(Base.observedAttributes || []),
      ...(properties ? Object.keys(properties) : []),
    ]),
  ];
  Object.defineProperty(CustomElement, "observedAttributes", {
    value: observedAttributes,
  });

  //#region create properties
  for (const [attr, def] of Object.entries(properties || {})) {
    const {
      type = String,
      get,
      set,
      readOnly,
      serialize,
      deserialize,
    } = typeof def === "function" ? { type: def } : def || {};

    const propName = toCamelCase(attr);

    const descriptor = {};

    descriptor.get =
      get ||
      (function () {
        if (deserialize) {
          return function () {
            return deserialize(this.getAttribute(attr));
          };
        }

        return function () {
          if (type === Boolean) {
            return this.hasAttribute(attr);
          }

          let value = this.getAttribute(attr);

          if (value == null) {
            return null;
          }

          if (type === Array || type === Object) {
            try {
              value = JSON.parse(value);
            } catch {
              value = null;
            }
          } else if (type === Number) {
            value = Number(value);
          } else if (type === Date) {
            value = new Date(value);
          }

          return value;
        };
      })();

    if (!readOnly) {
      descriptor.set =
        set ||
        (function () {
          if (serialize) {
            return function (value) {
              value = serialize(value);
              return value == null
                ? this.removeAttribute(attr)
                : this.setAttribute(attr, value);
            };
          }

          return function (value) {
            if (type === Boolean) {
              return value
                ? this.setAttribute(attr, "")
                : this.removeAttribute(attr);
            }

            if (value == null) {
              return this.removeAttribute(attr);
            }

            if (type === Date || type === Number) {
              value = value.toString();
            } else if (type === Array || type === Object) {
              try {
                value = JSON.stringify(value);
              } catch {
                return this.removeAttribute(attr);
              }
            }

            this.setAttribute(attr, value);
          };
        })();
    }

    Object.defineProperty(CustomElement.prototype, propName, descriptor);
  }

  //#region attach custom methods
  for (const [key, value] of Object.entries(custom)) {
    CustomElement.prototype[key] = value;
  }

  //#region define custom element
  if (!window.customElements.get(config.is)) {
    window.customElements.define(config.is, CustomElement);
  }

  return CustomElement;
}
