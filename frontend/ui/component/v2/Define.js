//#region helper functions
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

function addToMap(map, item, key = (i) => i) {
  const _key = key(item);

  if (!map.has(_key)) {
    map.set(_key, []);
  }

  map.get(_key).push(item);
}

function regroupMap(inputMap, key = (i) => i) {
  const outputMap = new Map();

  for (const item of inputMap.values()) {
    addToMap(outputMap, item, key);
  }

  return outputMap;
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

// TODO: parse -> save bindings with actual nodes -> loop through all bindings and insert comment before the nodes -> replace the bindings' node marker with the comment's/marker's id
//#region template parser
function parseTemplate(root) {
  const bindingsPerNode = new Map();

  function addBinding(node, binding) {
    if (!bindingsPerNode.has(node)) {
      bindingsPerNode.set(node, []);
    }

    bindingsPerNode.get(node).push(binding);
  }

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;

      const matches = [...text.matchAll(/\[\[(.*?)\]\]/g)];

      if (!matches.length) return;

      addBinding(node, {
        type: "text",
        template: text,
        node,
        bindings: Object.freeze(
          matches.map((b) =>
            Object.freeze({
              raw: b[0],
              expr: b[1].trim(),
            }),
          ),
        ),
      });

      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      if (tagName === "template") {
        const is = node.getAttribute("is");

        if (is === "dom-if") {
          const condition = node.getAttribute("if");

          const match = condition?.match(/\[\[(.*?)\]\]/);

          if (!match) {
            return;
          }

          addBinding(node, {
            type: "if",
            node,
            condition: match[1].trim(),
            template: node.content,
          });

          return;
        }

        if (is === "dom-repeat") {
          const items = node.getAttribute("items");

          const match = items?.match(/\[\[(.*?)\]\]/g);

          if (!match) {
            return;
          }

          addBinding(node, {
            type: "repeat",
            node,
            items: match[1].trim(),
            template: node.content,
          });

          return;
        }
      }

      for (const attr of node.attributes) {
        const matches = [...attr.value.matchAll(/\[\[(.*?)\]\]/g)];

        if (!matches.length) continue;

        const isPropBinding = attr.name.endsWith("$");

        addBinding(node, {
          type: isPropBinding ? "property" : "attribute",
          name: isPropBinding ? toCamelCase(attr.name.slice(0, -1)) : attr.name,
          node,
          template: attr.value,
          bindings: Object.freeze(
            matches.map((b) =>
              Object.freeze({
                raw: b[0],
                expr: b[1].trim(),
              }),
            ),
          ),
        });
      }

      // ! stop at custom element boundary, so we don't look into them because thats their territory
      if (tagName.includes("-")) {
        return;
      }

      for (const child of [...node.childNodes]) {
        walk(child);
      }

      return;
    }

    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      node.childNodes.forEach((node) => {
        walk(node);
      });
    }
  };

  walk(root);

  return bindingsPerNode;
}

//#region marker inserter
function insertMarkers(bindingsPerNode) {
  const bindingsPerMarker = new Map();
  let markerId = 0;

  for (const [node, bindings] of bindingsPerNode) {
    if (!node.parentNode) continue;

    const marker = document.createComment(`polyester-marker-${markerId}`);

    node.parentNode.insertBefore(marker, node);

    const isStructural = bindings.some(
      (b) => b.type === "if" || b.type === "repeat",
    );

    if (isStructural) {
      node.remove();
    }

    for (const bindingConfig of bindings) {
      bindingConfig.marker = markerId;
      bindingConfig.node = null;
    }

    bindingsPerMarker.set(markerId, bindings);

    markerId++;
  }

  return bindingsPerMarker;
}

//#region marker resolver
function getSiblingNode(node) {
  let next = node.nextSibling;

  while (
    next &&
    next.nodeType !== Node.ELEMENT_NODE &&
    next.nodeType !== Node.TEXT_NODE
  ) {
    next = next.nextSibling;
  }

  return next;
}

function resolveMarkersToNodes(root, bindingsPerMarker) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);

  const markerToNode = new Map();

  let node;

  while ((node = walker.nextNode())) {
    const value = node.nodeValue;

    if (!value) {
      continue;
    }

    if (!value.startsWith("polyester-marker-")) {
      continue;
    }

    const markerId = Number(value.slice("polyester-marker-".length));

    if (Number.isNaN(markerId)) {
      continue;
    }

    const bindings = bindingsPerMarker.get(markerId);

    if (!bindings) {
      continue;
    }

    const targetNode = getSiblingNode(node);

    const isStructural = bindings.some((b) => b.type === "if");

    if (isStructural) {
      markerToNode.set(markerId, node);
      continue;
    }

    if (!targetNode) {
      continue;
    }

    markerToNode.set(markerId, targetNode);
  }

  return markerToNode;
}

//#region dependency graph
function createDependencyGraph(inputMap) {
  const bindingsPerDependency = new Map();

  const getExpressions = (bindingConfig) => {
    if (bindingConfig.bindings) {
      return bindingConfig.bindings.map((b) => b.expr);
    }

    if (bindingConfig.condition) {
      return [bindingConfig.condition];
    }

    if (bindingConfig.items) {
      return [bindingConfig.items];
    }

    return [];
  };

  for (const bindings of inputMap.values()) {
    for (const bindingConfig of bindings) {
      for (const expr of getExpressions(bindingConfig)) {
        const dependency = getRootFromPath(expr);

        if (!bindingsPerDependency.has(dependency)) {
          bindingsPerDependency.set(dependency, []);
        }

        bindingsPerDependency.get(dependency).push(bindingConfig);
      }
    }
  }

  return bindingsPerDependency;
}

function resolvedToDisplayValue(binding, value) {
  if (value === undefined) {
    console.warn(`Binding "${binding}" resolved to undefined.`);
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

//#region main function
export default function Polyester(config = {}) {
  const {
    is,
    super: Base = HTMLElement,
    parsingMethod = "instance",
    template,
    created,
    connected,
    disconnected,
    attributeChanged,
    properties = {},
    ...custom
  } = config;

  let templateNode;

  if (typeof template === "string") {
    templateNode = document.createElement("template");
    templateNode.innerHTML = template;
  } else if (template instanceof HTMLTemplateElement) {
    templateNode = template;
  } else {
    console.warn("The provided template is invalid.");
    templateNode = document.createElement("template");
  }

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
      this._domReady = false;
      this._markerToNode = null;
      this._bindings = null;
      this._bindingDependencies = null;
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

    _mergeDependecies(dependencies) {
      for (const [dependency, bindings] of dependencies) {
        if (!this._bindingDependencies.has(dependency)) {
          this._bindingDependencies.set(dependency, []);
        }

        this._bindingDependencies.get(dependency).push(...bindings);
      }
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

          this._asyncUpdateBindingsForDependency(propName);
          this._markDependentsDirty(propName);
        }
      }
    }

    //#region other internals
    // if a property is not listed, but in html you try to set it with propname$="[[reference]]" it will resolve to undefined, since the code below
    // assumes a getter for the properties, which is only possible if it was set correctly.
    _resolvePath(path, scope = this) {
      const parts = path.split(".");
      let value = scope;

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
    _asyncUpdateBindingsForDependency(dependency, meta) {
      if (!this._constructed || !this.isConnected) {
        console.warn(
          "Async scheduling disabled while the component is not yet constructed!",
        );
        return;
      }

      this._bindingUpdateQueue.add(dependency);

      if (this._hasScheduledBindingUpdate) {
        return;
      }

      this._hasScheduledBindingUpdate = true;

      window.queueMicrotask(() => {
        for (const dependency of this._bindingUpdateQueue) {
          this._syncUpdateBindingsForDependency(dependency);
        }

        this._bindingUpdateQueue.clear();
        this._hasScheduledBindingUpdate = false;
      });
    }

    //#region binding and content init
    _initializeContent() {
      if (this._domReady) {
        return;
      }

      if (parsingMethod === "element") {
        const fragment = this.constructor.__template.content.cloneNode(true);

        this.innerHTML = "";
        this.appendChild(fragment);

        const bindingsPerLocalNode = new Map();

        // ! never overwrite bindingConfig.bindings
        for (const [markerId, localNode] of resolveMarkersToNodes(
          this,
          this.constructor.__bindingsPerMarker,
        )) {
          for (const bindingConfig of this.constructor.__bindingsPerMarker.get(
            markerId,
          )) {
            const bindingConfigCopy = {
              ...bindingConfig,
              node: localNode,
            };

            if (!bindingsPerLocalNode.has(localNode)) {
              bindingsPerLocalNode.set(localNode, []);
            }

            bindingsPerLocalNode.get(localNode).push(bindingConfigCopy);
          }
        }
        this._bindings = bindingsPerLocalNode;
        console.log(this._bindings);
        this._bindingDependencies = createDependencyGraph(bindingsPerLocalNode);
        console.log(this._bindingDependencies);

        this._domReady = true;

        return;
      }

      const template = this.querySelector("template");

      if (!template) {
        console.warn(`<${config.is}> must have a <template> child!`);
        return;
      }

      const fragment = template.content.cloneNode(true);

      template.remove();
      this.appendChild(fragment);

      let allBindings = [];

      // extract all bindings
      this.childNodes.forEach((node) => {
        allBindings = [...allBindings, ...parseTemplate(node)];
      });

      this._bindings = new Map(allBindings);
      this._bindingDependencies = createDependencyGraph(this._bindings);

      this._domReady = true;
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
        const { name } = bindingConfig;

        if (node.getAttribute(name) !== cache) {
          return node.setAttribute(name, cache);
        }
      }

      if (type === "property") {
        if (typeof node._setProperty !== "function") {
          console.warn(`<${node.tagName}> does not implement _setProperty.`);
          return;
        }

        return node._setProperty(
          bindingConfig.name,
          this._resolvePath(bindingConfig.bindings[0].expr),
          { origin: "binding", srcElement: this },
        );
      }
    }

    _syncUpdateBindingsForDependency(dependency) {
      if (!this._bindingDependencies) {
        return;
      }

      const bindings = this._bindingDependencies.get(dependency);

      if (!bindings) {
        return;
      }

      for (const bindingConfig of bindings) {
        if (bindingConfig.type === "if") {
          this._updateDomIf(bindingConfig);
          continue;
        }

        if (bindingConfig.type === "repeat") {
          continue;
        }

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
          if (bindingConfig.type === "if") {
            this._updateDomIf(bindingConfig);
            continue;
          }

          if (bindingConfig.type === "repeat") {
            continue;
          }

          if (bindingConfig.type !== "property") {
            this._updateBindingCache(bindingConfig);
          }

          this._applyChanges(bindingConfig);
        }
      });
    }

    //#region dom-if
    _parseDomIf(bindingConfig) {
      // already parsed
      if (bindingConfig._instanceFragment) {
        return;
      }

      const fragment = bindingConfig.template.cloneNode(true);

      const bindingsPerNode = parseTemplate(fragment);
      const bindingsPerMarker = insertMarkers(bindingsPerNode);

      const domIfBindings = new Map();

      for (const [markerId, localNode] of resolveMarkersToNodes(
        fragment,
        bindingsPerMarker,
      )) {
        for (const domIfBindingConfig of bindingsPerMarker.get(markerId)) {
          const domIfBindingConfigCopy = {
            ...domIfBindingConfig,
            node: localNode,
          };

          if (!domIfBindings.has(localNode)) {
            domIfBindings.set(localNode, []);
          }

          domIfBindings.get(localNode).push(domIfBindingConfigCopy);
        }
      }

      const dependencies = createDependencyGraph(domIfBindings);

      this._mergeDependecies(dependencies);

      bindingConfig._instanceFragment = {
        fragment,
        nodes: [...fragment.childNodes],
        bindings: domIfBindings,
        dependencies,
        _inserted: false,
      };

      this._updateDomIfBindings(bindingConfig._instanceFragment); // initial update just like with main dom

      return bindingConfig._instanceFragment;
    }

    _updateDomIf(bindingConfig) {
      const shouldRender = !!this._resolvePath(bindingConfig.condition, this);

      let instanceFragment = bindingConfig._instanceFragment;

      if (!instanceFragment) {
        instanceFragment = this._parseDomIf(bindingConfig);
      }

      const { nodes } = instanceFragment;
      const parent = bindingConfig.node.parentNode;
      const anchor = bindingConfig.node.nextSibling;

      if (shouldRender) {
        if (!instanceFragment._inserted) {
          for (const node of nodes) {
            parent.insertBefore(node, anchor);
          }

          instanceFragment._inserted = true;
        }
      } else {
        if (instanceFragment._inserted) {
          for (const node of nodes) {
            if (node.isConnected) {
              node.remove();
            }
          }

          instanceFragment._inserted = false;
        }
      }
    }

    _updateDomIfBindings(instanceFragment) {
      for (const bindings of instanceFragment.bindings.values()) {
        for (const bindingConfig of bindings) {
          if (bindingConfig.type === "property") {
            this._applyChanges(bindingConfig);
          } else if (bindingConfig.type === "if") {
            this._updateDomIf(bindingConfig);
          } else {
            this._updateBindingCache(bindingConfig);
            this._applyChanges(bindingConfig);
          }
        }
      }
    }

    //#region dom-repeat
    _updateDomRepeat(bindingConfig) {}

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

    //#region centralized property setter
    // prettier-ignore
    _handlePropertyChangeSideEffects(propName, oldValue, newValue, notify, meta) {
      if (this._constructed) {
        if (this.isConnected) {
          this._markDependentsDirty(propName);
          this._asyncUpdateBindingsForDependency(propName, { origin: "_setProperty" });
        }

        if (notify) {
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
    }

    _throwOnReadOnlyViolation(propName, value, readOnly, meta) {
      if (readOnly && this._constructed) {
        console.error(
          `Assignment to read-only property "${propName}" (origin: "${meta.origin}").`,
        );

        return true;
      }
    }

    _serialize(value, serializer) {
      if (typeof serializer === "function") {
        return serializer(value);
      }

      return value;
    }

    // prettier-ignore
    _setProperty(propName, newValue, meta) {
      const propertySchema =
        this.constructor.__propertySchema?.[propName] || {};

      const { serialize, notify, reflect, readOnly } = propertySchema;

      if (this._throwOnReadOnlyViolation(propName, newValue, readOnly, meta)) {
        return;
      }

      const oldValue = this._properties[propName];
      
      newValue = this._serialize(newValue, serialize);

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

      this._initializeContent();
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
      const propName = toCamelCase(name);

      if (typeof propertySchema[propName]?.change === "function") {
        propertySchema[propName].change.call(this, oldValue, newValue);
      }

      // Reflect attrib into prop
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

  //#region attach template
  Object.defineProperty(CustomElement, "__template", {
    value: templateNode,
    enumerable: false,
  });

  //#region attach bindings
  Object.defineProperty(CustomElement, "__bindingsPerMarker", {
    value: (function () {
      return insertMarkers(parseTemplate(templateNode.content));
    })(),
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
