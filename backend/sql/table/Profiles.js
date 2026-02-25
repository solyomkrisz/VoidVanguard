const Table = require("../Table.js");
const Column = require("../Column.js");
const CustomError = require("../../common/CustomError.js");
const { execute } = require("../database.js");
const { isFriend } = require("../../common/common.js");
const Role = require("../../common/Role.js");
const Permission = require("../../common/Permission.js");

class Profiles extends Table {
  constructor() {
    super({
      columns: [
        new Column("user_id"),
        new Column("avatar").grant(Role.USER, Permission.W),
        new Column("display_name").grant(Role.USER, Permission.W),
        new Column("description").grant(Role.USER, Permission.W),
        new Column("visibility").grant(Role.USER, Permission.W),
        new Column("created_at"),
        new Column("updated_at"),
      ],
    });
  }

  async exists(id) {
    const [rows] = await execute("SELECT 1 FROM profiles WHERE user_id = ?", [
      id,
    ]);
    return !!rows.length;
  }

  async _select(id) {
    const [rows] = await execute(
      "SELECT avatar, display_name, description, visibility FROM profiles WHERE user_id = ?",
      [id],
    );
    if (!rows.length) {
      throw CustomError.PROFILE_NOT_FOUND;
    }
    return rows[0];
  }

  // prettier-ignore
  async select(request) {
    const { id } = request.params;

    const [rows] = await execute(
      "SELECT avatar, display_name, description, visibility FROM profiles WHERE user_id = ?",
      [id],
    );

    if (!rows.length) {
      throw CustomError.PROFILE_NOT_FOUND;
    }

    const { avatar, display_name: displayName, description, visibility } = rows[0];

    const _isFriend = await isFriend(request);

    if (
      (visibility === "friends-only" && _isFriend) ||
      visibility === "public" ||
      request?.user?.role >= Role.ADMIN
    ) {
      return { avatar, displayName, description };
    }

    return { avatar, displayName, description: "" };
  }

  async create({ targetUser: { sub: id, role }, body }) {
    let query = "INSERT INTO profiles (user_id, ";
    let placeholders = "?, ";
    const values = [id];

    for (const column of Object.keys(body)) {
      if (!this.hasPermission(column, role, Permission.W)) {
        continue;
      }

      query += `${column}, `;
      placeholders += "?, ";
      values.push(body[column]);
    }

    query = query.slice(0, -2) + ") VALUES (" + placeholders.slice(0, -2) + ")";

    const [result] = await execute(query, values);
    return result;
  }

  async update({ targetUser: { sub: id, role }, body }) {
    const data = await this._select(id);

    let query = "UPDATE profiles SET ";
    const values = [];

    for (const column of Object.keys(body)) {
      if (!this.hasPermission(column, role, Permission.W)) {
        continue;
      }

      if (body[column] === data[column]) {
        continue;
      }

      query += `${column} = ?, `;
      values.push(body[column]);
    }

    if (!values.length) {
      throw CustomError.NO_DATA_CHANGE;
    }

    query = query.slice(0, -2) + " WHERE user_id = ?";
    values.push(id);

    const [result] = await execute(query, values);
    return result;
  }

  async delete({ targetUser: { sub: id } }) {
    const [result] = await execute("DELETE FROM profiles WHERE user_id = ?", [
      id,
    ]);
    return result;
  }
}

module.exports = new Profiles();
