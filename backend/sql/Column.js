const Role = require("../common/Role.js");

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
        if (role >= _role) {
          _permissions.forEach((p) => permissions.add(p));
        }
      }

      return permissions.has(permission);
    }

    if (this.permissions.has(role)) {
      return this.permissions.get(role).has(permission);
    }

    return false;
  }
}

module.exports = Column;
