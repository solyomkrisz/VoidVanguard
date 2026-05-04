const handlers = new Map();

export function on(type, handler) {
  if (!handlers.has(type)) {
    handlers.set(type, new Set());

    document.addEventListener(type, (e) => {
      const set = handlers.get(type);
      if (!set) return;

      set.forEach((handler) => handler(e));
    });
  }

  handlers.get(type).add(handler);
}

export function off(type, handler) {
  if (!handlers.has(type)) return;

  const set = handlers.get(type);
  set.delete(handler);

  if (set.size === 0) {
    handlers.delete(type);
  }
}
