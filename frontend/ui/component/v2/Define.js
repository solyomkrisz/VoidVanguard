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

function isIndex(key) {
  return String(Number(key)) === key;
}

function clone(value) {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (value && typeof value === "object") {
    return { ...value };
  }

  return value;
}

function resolvedToDisplayValue(binding, value) {
  if (value === undefined) {
    console.warn(`Binding ${binding} resolved to undefined`);
    return "";
  }

  if (value === null) return "";

  return String(value);
}

function getRootFromPath(path) {
  return path.split(".").shift();
}

function getPropertyConfig(config) {
  return typeof config === "function" ? { type: config } : config || {};
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

  const normalizedPropertyDefinitions = {};

  for (const [key, value] of Object.entries(properties)) {
    normalizedPropertyDefinitions[key] = getPropertyConfig(value);
  }

  if (!is) {
    console.warn("Couldn't define custom element: no name is provided.");
    return;
  }

  class CustomElement extends Base {
    //#region constructor
    constructor() {
      super();

      this._constructed = false;
      this._properties = {};
      this._computed = {};
      this._dependencies = new Map();
      this._computing = new Set();
      this._computingStack = [];
      this._parsed = false;
      this._bindings = null;
      this._bindingDependencies = new Map();
      this._bindingUpdateQueue = new Set();
      this._hasScheduledBindingUpdate = false;

      //#region set default properties
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

        this._setProperty(propName, value, { origin: "constructor" });
      }

      if (typeof created === "function") {
        created.call(this);
      }

      this._constructed = true;
    }

    //#region dependency related
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

        if (computed && !computed.dirty) {
          computed.dirty = true;

          this._scheduleBindingUpdate(propName);
          this._markDependentsDirty(propName);
        }
      }
    }

    //#region other internals
    _resolvePath(path) {
      const parts = path.split(".");
      let value = this;

      for (const part of parts) {
        if (value == null) return value;

        if (value === this && part in this._computed) {
          value = this._getComputed(part);
        } else {
          const key = isIndex(part) ? Number(part) : part;
          value = value[key];
        }
      }

      return value;
    }

    //#region batch updates
    _scheduleBindingUpdate(dependency, meta) {
      this._bindingUpdateQueue.add(dependency);

      if (this._hasScheduledBindingUpdate) {
        return;
      }

      this._hasScheduledBindingUpdate = true;

      window.queueMicrotask(() => {
        for (const dependency of this._bindingUpdateQueue) {
          this._updateBindingsForDependency(dependency);
        }

        this._bindingUpdateQueue.clear();
        this._hasScheduledBindingUpdate = false;
      });
    }

    //#region binding parser
    _parseTemplate() {
      if (this._parsed) {
        return;
      }

      const root = this;

      const bindings = new Map();

      const addBinding = (node, bindingConfig) => {
        if (!bindings.has(node)) {
          bindings.set(node, []);
        }

        bindings.get(node).push(bindingConfig);

        // register binding dependencies
        for (const { expr } of bindingConfig.bindings) {
          const dependency = getRootFromPath(expr);

          if (!this._bindingDependencies.has(dependency)) {
            this._bindingDependencies.set(dependency, new Set());
          }

          this._bindingDependencies.get(dependency).add(bindingConfig);
        }

        return bindingConfig;
      };

      const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;

          const matches = [...text.matchAll(/\[\[(.*?)\]\]/g)];

          if (matches.length) {
            addBinding(node, {
              type: "text",
              node,
              template: text,
              cache: text,
              bindings: matches.map((b) => ({
                raw: b[0],
                expr: b[1].trim(),
              })),
            });
          }

          return;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();

          for (const attr of node.attributes) {
            const isPropBinding = attr.name.endsWith("$");

            const matches = [...attr.value.matchAll(/\[\[(.*?)\]\]/g)];

            if (matches.length) {
              const bindingConfig = {
                node,
                attribute: attr.name,
                bindings: matches.map((b) => ({
                  raw: b[0],
                  expr: b[1].trim(),
                })),
              };

              if (isPropBinding) {
                bindingConfig.type = "property";
                bindingConfig.propName = attr.name.slice(0, -1);

                addBinding(node, bindingConfig);
              } else {
                bindingConfig.type = "attribute";
                bindingConfig.template = attr.value;
                bindingConfig.cache = attr.value;

                addBinding(node, bindingConfig);
              }
            }
          }

          // ! stop at custom element boundary, so we don't look into them because thats their territory
          if (tagName.includes("-")) {
            return;
          }

          for (const child of node.childNodes) {
            walk(child);
          }
        }
      };

      for (const child of root.childNodes) {
        walk(child);
      }

      this._bindings = bindings;
      this._parsed = true;
    }

    _updateBindingTemplate(template, bindings) {
      let result = template;

      for (const { raw, expr } of bindings) {
        const value = this._resolvePath(expr);
        const display = resolvedToDisplayValue(expr, value);

        result = result.split(raw).join(display);
      }

      return result;
    }

    _updateBindingCache(bindingConfig) {
      bindingConfig.cache = this._updateBindingTemplate(
        bindingConfig.template,
        bindingConfig.bindings,
      );
    }

    _applyChanges(bindingConfig) {
      const { type, node, cache } = bindingConfig;

      if (type === "text" && node.textContent !== cache) {
        return (node.textContent = cache);
      }

      if (type === "attribute") {
        const { attribute } = bindingConfig;

        if (node.getAttribute(attribute) !== cache) {
          return node.setAttribute(bindingConfig.attribute, cache);
        }
      }

      if (type === "property") {
        return node._setProperty(
          bindingConfig.propName,
          this._resolvePath(bindingConfig.bindings[0].expr),
          { origin: "binding", srcElement: this },
        );
      }
    }

    _updateBindingsForDependency(dependency) {
      if (!this._bindingDependencies) {
        return;
      }

      const bindings = this._bindingDependencies.get(dependency);

      if (!bindings) {
        return;
      }

      for (const bindingConfig of bindings) {
        if (bindingConfig.type !== "property") {
          this._updateBindingCache(bindingConfig);
        }

        this._applyChanges(bindingConfig);
      }
    }

    _initializeBindings() {
      if (!this._bindings) {
        return;
      }

      this._bindings.forEach((bindings) => {
        for (const bindingConfig of bindings) {
          if (bindingConfig.type !== "property") {
            this._updateBindingCache(bindingConfig);
          }

          this._applyChanges(bindingConfig);
        }
      });
    }

    //#region computed prop related
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

      if (this._computing.has(propName)) {
        console.warn(
          `Circular dependency detected: "${[...this._computingStack, propName].join(" → ")}"`,
        );
        return;
      }

      if (prop.dirty) {
        this._computing.add(propName);
        this._computingStack.push(propName);

        try {
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
        } finally {
          this._computing.delete(propName);
          this._computingStack.pop();
        }
      }

      return prop.value;
    }

    //#region exposed apis
    set(path, value) {
      if (typeof path !== "string") {
        return;
      }

      const parts = path.split(".");
      const rootProp = parts.shift();

      if (!(rootProp in this._properties)) {
        console.warn(`Property ${rootProp} does not exist.`);
        return;
      }

      const rootValue = this._properties[rootProp];

      let newRoot = clone(rootValue);
      let current = newRoot;

      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        const nextKey = parts[i + 1];

        const decodedKey = isIndex(key) ? Number(key) : key;

        let next = current[decodedKey];

        if (next == null) {
          next = isIndex(nextKey) ? [] : {};
        } else {
          next = clone(next);
        }

        current[decodedKey] = next;
        current = next;
      }

      let lastKey = parts[parts.length - 1];
      lastKey = isIndex(lastKey) ? Number(lastKey) : lastKey;

      current[lastKey] = value;

      this._setProperty(rootProp, newRoot, { origin: "set" });
    }

    // prettier-ignore
    _handlePropertyChangeSideEffects(propName, oldValue, newValue, notify, meta) {
      if (this._constructed) {
        this._markDependentsDirty(propName);
        this._scheduleBindingUpdate(propName, { origin: "_setProperty" });
      }

      if (this._constructed && notify) {
        this.dispatchEvent(
          new CustomEvent(`${toKebabCase(propName)}-changed`, {
            detail: {
              old: oldValue,
              new: newValue,
            },
            bubbles: true,
            composed: true,
          }),
        );
      }
    }

    _throwOnReadOnlyViolation(propName, value, readOnly, meta) {
      if (readOnly && this._constructed) {
        throw new Error(
          `Assignment to read-only property "${propName}" (origin: "${meta.origin}").`,
        );
      }
    }

    _serialize(value, serializer) {
      if (typeof serializer === "function") {
        return serializer(value);
      }

      return value;
    }

    //#region centralized property setter
    // prettier-ignore
    _setProperty(propName, newValue, meta) {
      const propertySchema =
        this.constructor.__propertySchema?.[propName] || {};

      const { serialize, notify, reflect, readOnly } = propertySchema;

      this._throwOnReadOnlyViolation(propName, newValue, readOnly, meta);

      const oldValue = this._properties[propName];
      
      newValue = this._serialize(newValue);

      this._properties[propName] = newValue;

      if (!Object.is(oldValue, newValue)) {
        this._handlePropertyChangeSideEffects(propName, oldValue, newValue, notify, meta);
      }

      this._reflectToAttribute(reflect, propName, newValue, propertySchema, meta);
    }

    // prettier-ignore
    _reflectToAttribute(reflect, propName, value, schema, meta) {
      if (!reflect || !this._constructed || meta?.origin === "attributeChangedCallback") {
        return;
      }

      const attrName = toKebabCase(propName);

      const { type } = schema;

      if (!type) {
        value = String(value);
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

    //#region lifecycle callbacks
    connectedCallback() {
      super.connectedCallback?.(this);

      const template = this.querySelector("template");

      if (!template) {
        console.warn(`<${config.is}> must have a <template> child!`);
        return;
      }

      const fragment = template.content.cloneNode(true);

      template.remove();
      this.appendChild(fragment);

      this._parseTemplate();
      this._initializeBindings();

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

      const propertySchema = this.constructor.__propertySchema;

      if (typeof propertySchema[name]?.change === "function") {
        propertySchema[name].change.call(this, oldValue, newValue);
      }

      // Reflect attrib into prop
      const propName = toCamelCase(name);

      if (propertySchema[propName]?.reflect) {
        this._setProperty(propName, newValue, {
          origin: "attributeChangedCallback",
        });
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
    const options = normalizedPropertyDefinitions[prop];

    const isComputed = typeof def === "string" || (def && def.computed);

    const descriptor = {};

    if (isComputed) {
      descriptor.get = function () {
        return this._getComputed(prop);
      };
    } else {
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

      descriptor.get = options.get || createDefaultGetter();

      if (!options.readOnly) {
        descriptor.set =
          options.set ||
          function (value) {
            this._setProperty(prop, value, { origin: "setter" });
          };
      }
    }

    Object.defineProperty(CustomElement.prototype, prop, descriptor);
  }

  //#region attach custom methods
  for (const [key, value] of Object.entries(custom)) {
    CustomElement.prototype[key] = value;
  }

  //#region attach property definitions
  Object.defineProperty(CustomElement, "__propertySchema", {
    value: normalizedPropertyDefinitions,
    enumerable: false,
  });

  //#region define custom element
  if (window.customElements.get(config.is)) {
    console.warn(`Custom element <${config.is}> has already been defined.`);
  } else {
    window.customElements.define(config.is, CustomElement);
  }

  return CustomElement;
}
