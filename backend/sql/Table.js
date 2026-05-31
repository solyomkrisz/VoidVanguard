/**
 * Kezdobarat magyarazat:
 * Fajl: backend/sql/Table.js
 * Szerep: A tabla oszlopkeszletet becsomagolo vekony helper, ami a Columns objektumnak delegal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Columns from "./Columns.js";

class Table {
  constructor({ columns = [] } = {}) {
    // A Table maga vékony wrapper: a valódi oszlop- és jogosultságlogika a Columns osztályban van.
    this.columns = new Columns({ all: columns });
  }

  hasPermission(column, role, permission, inherit = true) {
    return this.columns.hasPermission(column, role, permission, inherit);
  }

  columnExists(column) {
    return this.columns.exists(column);
  }
}

export default Table;
