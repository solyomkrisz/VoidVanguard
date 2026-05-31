/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/common/eventhub.js
 * Szerep: Dokumentum szintu pub/sub esemenyhub egyszeru on/off API-val.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
const handlers = new Map();

// Feliratkozik egy esemenytipusra, es belul egy kozos document-listenerre fuz fel handlereket.
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

// Levesz egy korabban regisztralt handlert, es ha mar nincs hallgato, a belso nyilvantartast is takaritja.
export function off(type, handler) {
  if (!handlers.has(type)) return;

  const set = handlers.get(type);
  set.delete(handler);

  if (set.size === 0) {
    handlers.delete(type);
  }
}
