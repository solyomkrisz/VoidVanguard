class Columns {
  constructor({ all = [] } = {}) {
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
}

export default Columns;
