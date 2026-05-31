/**
 * Kezdobarat magyarazat:
 * Fajl: backend/sql/Columns.js
 * Szerep: Oszlopdefiniciok gyujtemenye gyors nev szerinti keresessel es jogosultsag-delegalassal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
class Columns {
  constructor({ all = [] } = {}) {
    // A Map miatt egy oszlopot nev alapjan gyorsan meg lehet talalni.
    this.all = new Map();
    for (const column of all) {
      this.all.set(column.name, column);
    }
  }

  hasPermission(column, role, permission, inherit = true) {
    if (!this.all.has(column)) {
      return false;
    }
    return this.all.get(column).hasPermission(role, permission, inherit);
  }

  exists(column) {
    return this.all.has(column);
  }
}

export default Columns;
