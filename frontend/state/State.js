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
    this.store = new Map();

    for (const key of Object.keys(initial)) {
      this.store.set(key, { value: initial[key], listeners: new Set() });
    }
  }

  get(key) {
    return this.store.get(key);
  }

  valueOf(key) {
    return this.store.get(key).value;
  }

  from(obj) {
    for (const key of Object.keys(obj)) {
      this.set(key, obj[key]);
    }
  }

  set(key, value) {
    if (!this.store.has(key)) {
      this.store.set(key, { value, listeners: new Set() });
      return;
    }

    const _value = this.store.get(key);

    _value.value = value;

    for (const listener of _value.listeners) {
      listener(key, value);
    }
  }

  sub(key, listener) {
    if (!this.store.has(key)) {
      this.set(key, undefined);
    }

    const { value, listeners } = this.store.get(key);

    listeners.add(listener);

    // if (value !== undefined) {
    //   listener(key, value);
    // }

    listener(key, value);

    return () => listeners.delete(listener);
  }

  reset() {
    for (const key of this.store.keys()) this.set(key, undefined);
  }
}
