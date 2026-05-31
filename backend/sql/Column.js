/**
 * Kezdobarat magyarazat:
 * Fajl: backend/sql/Column.js
 * Szerep: Egyetlen adatbazisoszlop szerepkoronkénti jogosultsagainak tarolasa es ellenorzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Role from "../common/Role.js";

class Column {
  constructor(name, permissions = new Map()) {
    this.name = name;
    this.permissions = permissions;
  }

  grant(role, permission) {
    if (!this.permissions.has(role)) {
      this.permissions.set(role, new Set());
    }
    this.permissions.get(role).add(permission);
    return this;
  }

  hasPermission(role, permission, inherit = true) {
    if (inherit) {
      const permissions = new Set();

      for (const [_role, _permissions] of this.permissions.entries()) {
        // A magasabb szerepkör megkapja az alacsonyabb szerepkörök jogait is.
        if (role >= _role) {
          _permissions.forEach((p) => permissions.add(p));
        }
      }

      return permissions.has(permission);
    }

    if (this.permissions.has(role)) {
      // Öröklés nélkül csak a pontosan ehhez a szerepkörhöz rendelt jogot nézzük.
      return this.permissions.get(role).has(permission);
    }

    return false;
  }
}

export default Column;
