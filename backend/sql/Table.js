import Columns from "./Columns.js";

class Table {
  constructor({ columns = [] } = {}) {
    this.columns = new Columns({ all: columns });
  }

  hasPermission(column, role, permission, inherit = true) {
    return this.columns.hasPermission(column, role, permission, inherit);
  }
}

export default Table;
