/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/core/Core.js
 * Szerep: UI komponensek kozponti exportja es alap osszekotese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { toCamelCase } from "/common/common.js";

export function defineAttributeAccessors(prototype, attributes) {
  for (const [name, options] of Object.entries(attributes)) {
    Object.defineProperty(prototype, toCamelCase(name), {
      get() {
        if (options.type === Boolean) {
          return this.hasAttribute(name);
        }

        const value = this.getAttribute(name);

        if (value == null) return null;

        return options.type(value);
      },
      set(value) {
        if (options.type === Boolean) {
          if (value) {
            this.setAttribute(name, "");
          } else {
            this.removeAttribute(name);
          }

          return;
        }

        if (value == null) {
          this.removeAttribute(name);
        } else {
          this.setAttribute(name, String(value));
        }
      },
    });
  }
}
