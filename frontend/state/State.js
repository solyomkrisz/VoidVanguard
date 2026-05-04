export default class State {
  static multiSubscribe(listenerInitializers, combinedListener) {
    const values = new Array(listenerInitializers.length);

    listenerInitializers.forEach((initializer, index) => {
      initializer((_, value) => {
        values[index] = value;
        combinedListener(...values);
      });
    });
  }

  constructor(initial = {}) {
    this.store = initial;
    this.listeners = new Map([["*", new Set()]]);
  }

  lookup(obj, path) {
    if (!path) return obj;

    let current = obj;

    for (const part of path.split(".")) {
      if (current == null) {
        return undefined;
      }

      current = current[part];
    }

    return current;
  }

  notify(path) {
    for (const [_path, _listeners] of this.listeners.entries()) {
      if (
        path === _path ||
        _path.startsWith(path + ".") ||
        path.startsWith(_path + ".")
      ) {
        const value = this.lookup(this.store, _path);

        for (const listener of _listeners) {
          listener(path, value);
        }
      }
    }
  }

  valueOf(path) {
    return this.lookup(this.store, path);
  }

  set(path, value, notifyGlobals = true) {
    const parts = path.split(".");
    let last = this.store;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (!last[part]) {
        last[part] = {};
      }

      last = last[part];
    }

    last[parts[parts.length - 1]] = value;

    this.notify(path);

    if (notifyGlobals) {
      for (const listener of this.listeners.get("*")) {
        listener(this.store);
      }
    }
  }

  from(obj) {
    this.store = {};

    for (const key in obj) {
      this.set(key, obj[key], false);
    }

    for (const listener of this.listeners.get("*")) {
      listener(this.store);
    }
  }

  sub(path, listener, notify = true) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set([listener]));
    }

    const listeners = this.listeners.get(path);

    listeners.add(listener);

    if (notify) {
      listener(path, this.lookup(this.store, path));
    }

    return () => listeners.delete(listener);
  }

  subscribeForAny(listener, notify = true) {
    const listeners = this.listeners.get("*");

    if (!listeners.has(listener)) {
      listeners.add(listener);

      if (notify) {
        listener(this.store);
      }
    }

    return () => listeners.delete(listener);
  }

  reset() {
    this.store = {};

    for (const [path, listeners] of this.listeners) {
      for (const listener of listeners) {
        listener(path, undefined);
      }
    }
  }
}
