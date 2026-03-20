function toCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/-+([a-z])/g, (_, char) => char.toUpperCase());
}

function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/(A-Z)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
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

      this._constructed = false;
      this._properties = {};
      this._computed = {};
      this._dependencies = new Map();

      // set default properties
      for (const [propName, def] of Object.entries(properties)) {
        // register computed properties
        if (typeof def === "string" || "computed" in def) {
          let computedDef;

          if (typeof def === "string") {
            computedDef = def;
          } else {
            computedDef = def.computed;
          }

          this._registerComputed(propName, computedDef);

          continue;
        }

        if (typeof def === "function" || !("value" in def)) {
          continue;
        }

        let value = def.value;

        if (typeof value === "function") {
          value = value.call(this);
        }

        this._setProperty(propName, value, { origin: "constructor" }, def);
      }

      this._bindings = new WeakMap();

      if (typeof created === "function") {
        created.call(this);
      }

      this._constructed = true;
    }

    _addDependency(dependent, dependency) {
      if (!this._dependencies.has(dependency)) {
        this._dependencies.set(dependency, new Set());
      }

      this._dependencies.get(dependency).add(dependent);
    }

    _markDependentsDirty(dependency) {
      const dependents = this._dependencies.get(dependency);

      if (!dependents) {
        return;
      }

      for (const propName of dependents) {
        const computed = this._computed[propName];

        if (computed) {
          computed.dirty = true;
        }
      }
    }

    _registerBindings() {
      const templates = this.querySelectorAll("template");
    }

    _parseComputed(str) {
      const match = str.match(/^(\w+)\s*\(([^)]*)\)$/);

      if (!match) {
        console.warn("Invalid computed property format.");
        return null;
      }

      return {
        fnName: match[1],
        params: match[2]
          .split(",")
          .map((param) => param.trim())
          .filter(Boolean),
      };
    }

    _registerComputed(propName, def) {
      const parsed = this._parseComputed(def);

      if (!parsed) {
        console.warn("Unable to register computed property.");
        return;
      }

      const fn = this[parsed.fnName];

      if (typeof fn !== "function") {
        console.warn(`Compute function ${parsed.fnName} is not defined.`);
        return;
      }

      const computedProperty = {
        ...parsed,
        fn,
        value: undefined,
        dirty: true,
      };

      this._computed[propName] = computedProperty;

      for (const param of computedProperty.params) {
        this._addDependency(propName, param);
      }
    }

    _getComputed(propName) {
      const prop = this._computed[propName];

      if (!prop) {
        return;
      }

      if (prop.dirty) {
        const args = prop.params.map((param) => {
          if (!(param in this)) {
            console.warn(
              `Missing dependency ${param} for computed ${propName}.`,
            );
            return undefined;
          }

          return this[param];
        });

        prop.value = prop.fn(...args);
        prop.dirty = false;
      }

      return prop.value;
    }

    _setProperty(propName, value, meta, options = {}) {
      const { serialize, notify, reflect, type } = options;

      const old = this._properties[propName];

      if (typeof serialize === "function") {
        value = options.serialize(value);
      }

      this._properties[propName] = value;

      const attrName = toKebabCase(propName);

      if (!Object.is(old, value)) {
        this._markDependentsDirty(propName);

        if (this._constructed && notify) {
          this.dispatchEvent(
            new CustomEvent(`${attrName}-changed`, {
              detail: {
                old,
                new: value,
              },
              bubbles: true,
              composed: true,
            }),
          );
        }
      }

      // prettier-ignore
      if (!reflect || !this._constructed || meta.origin === "attributeChangedCallback") {
        return;
      }

      if (type === Boolean) {
        return value
          ? this.setAttribute(attrName, "")
          : this.removeAttribute(attrName);
      }

      if (value == null) {
        return this.removeAttribute(attrName);
      }

      if (type === Date || type === Number) {
        value = value.toString();
      } else if (type === Array || type === Object) {
        try {
          value = JSON.stringify(value);
        } catch {
          return this.removeAttribute(attrName);
        }
      }

      this.setAttribute(attrName, value);
    }

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

      if (typeof attributeChanged === "function") {
        attributeChanged.call(this, name, oldValue, newValue);
      }

      if (typeof properties[name]?.change === "function") {
        properties[name].change.call(this, oldValue, newValue);
      }

      // Reflect attrib into prop
      const propName = toCamelCase(name);

      if (properties[propName]?.reflect) {
        this._setProperty(
          propName,
          newValue,
          {
            origin: "attributeChangedCallback",
          },
          properties[propName],
        );
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
  // prop must be in camelCase by default not kebab-case
  for (const [prop, def] of Object.entries(properties || {})) {
    const options = typeof def === "function" ? { type: def } : def || {};

    const isComputed = typeof def === "string" || (def && def.computed);

    function createDefaultGetter() {
      if (options.deserialize) {
        return function () {
          return deserialize(this._properties[prop]);
        };
      }

      return function () {
        return this._properties[prop];
      };
    }

    const descriptor = {};

    if (isComputed) {
      descriptor.get = function () {
        return this._getComputed(prop);
      };
    } else {
      descriptor.get = options.get || createDefaultGetter();

      if (!options.readOnly) {
        descriptor.set =
          options.set ||
          function (value) {
            this._setProperty(prop, value, { origin: "setter" }, options);
          };
      }
    }

    Object.defineProperty(CustomElement.prototype, prop, descriptor);
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
