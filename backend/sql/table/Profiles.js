import Table from "../Table.js";
import Column from "../Column.js";
import { execute } from "../database.js";
import Role from "../../common/Role.js";
import Permission from "../../common/Permission.js";

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

  async like(query, { limit = 6, offset = 0 } = {}) {
    const [rows] = await execute(
      "SELECT user_id, avatar, display_name FROM profiles WHERE display_name LIKE ? ORDER BY display_name ASC LIMIT ? OFFSET ?",
      [`${query}%`, limit, offset],
    );
    return rows;
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
    return rows.length ? rows[0] : null;
  }

  async create(userId, data) {
    const columns = Object.keys(data);

    if (!columns.length) return false;

    const query = `
      INSERT INTO profiles (user_id, ${columns.join(",")})
      VALUES (?, ${columns.map(() => "?").join(",")})
    `;

    const [result] = await execute(query, [userId, ...Object.values(data)]);

    return result.affectedRows > 0;
  }

  async update(userId, updates) {
    const columns = Object.keys(updates);

    if (!columns.length) return false;

    const set = columns.map((i) => `${i} = ?`).join(",");
    const values = [...Object.values(updates), userId];

    const [result] = await execute(
      `UPDATE profiles SET ${set} WHERE user_id = ?`,
      values,
    );

    return result.affectedRows > 0;
  }

  async delete(userId) {
    const [result] = await execute("DELETE FROM entities WHERE id = ?", [
      userId,
    ]);

    return result.affectedRows > 0;
  }
}

export default new Profiles();
