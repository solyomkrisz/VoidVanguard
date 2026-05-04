import Table from "../Table.js";
import Role from "../../common/Role.js";
import Permission from "../../common/Permission.js";
import Column from "../Column.js";
import { execute } from "../database.js";
import * as CustomError from "../../common/CustomError.js";
import Password from "../../common/Password.js";
import { runQueryWithPagination } from "../../common/common.js";

class Users extends Table {
  constructor() {
    super({
      columns: [
        new Column("id"),
        new Column("username").grant(Role.USER, Permission.W),
        new Column("role").grant(Role.ADMIN, Permission.W),
        new Column("email").grant(Role.USER, Permission.W),
        new Column("password").grant(Role.USER, Permission.W),
        new Column("created_at"),
      ],
    });
  }

  async search(query, options = {}) {
    const sql = `
      SELECT
        users.id,
        users.username,
        profiles.display_name,
        profiles.avatar,
        CASE WHEN profiles.user_id IS NULL THEN 0 ELSE 1 END AS has_profile
      FROM users
      LEFT JOIN profiles ON users.id = profiles.user_id
      WHERE
        users.username LIKE ? OR
        profiles.display_name LIKE ?
    `;

    return runQueryWithPagination(sql, [`${query}%`, `${query}%`], options);
  }

  async countForSearch(query) {
    const sql = `
      SELECT COUNT(DISTINCT users.id) AS count
      FROM users
      LEFT JOIN profiles ON users.id = profiles.user_id
      WHERE
        users.username LIKE ? OR
        profiles.display_name LIKE ?
    `;

    const [[{ count }]] = await execute(sql, [`${query}%`, `${query}%`]);

    return count;
  }

  async exists(id) {
    const [rows] = await execute("SELECT 1 FROM users WHERE id = ?", [id]);
    return !!rows.length;
  }

  async payload(id) {
    const [rows] = await execute(
      "SELECT id, username, role FROM users WHERE id = ?",
      [id],
    );
    return rows.length ? rows[0] : null;
  }

  async create({ id, username, email, passwordHash }) {
    const [result] = await execute(
      "INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)",
      [id, username, email, passwordHash],
    );
    return result;
  }

  async delete(id) {
    const [result] = await execute("DELETE FROM users WHERE id = ?", [id]);
    return result;
  }

  async login({ body: { username, password } }) {
    const [rows] = await execute(
      "SELECT id, username, role, password_hash FROM users WHERE username = ?",
      [username],
    );

    if (!rows.length) {
      throw CustomError.INVALID_CREDENTIALS;
    }

    if (!(await Password.compare(password, rows[0].password_hash))) {
      throw CustomError.INVALID_CREDENTIALS;
    }

    const data = rows[0];

    return { id: data.id, username: data.username, role: data.role };
  }

  async _selectByUsername(username) {
    const [rows] = await execute("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    return rows.length ? rows[0] : null;
  }

  async _select(id) {
    const [rows] = await execute("SELECT * FROM users WHERE id = ?", [id]);
    return rows.length ? rows[0] : null;
  }

  async select(id) {
    const [rows] = await execute(
      "SELECT id, username, role, email FROM users WHERE id = ?",
      [id],
    );
    return rows.length ? rows[0] : null;
  }

  async update(id, updates) {
    const columns = Object.keys(updates);

    if (!columns.length) return false;

    const set = columns.map((i) => `${i} = ?`).join(",");
    const values = [...Object.values(updates), id];

    const [result] = await execute(
      `UPDATE users SET ${set} WHERE id = ?`,
      values,
    );

    return result.affectedRows > 0;
  }

  async updatePassword(id, passwordHash) {
    const [result] = await execute(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [passwordHash, id],
    );
    return result;
  }

  async selectByEmail(email) {
    const [rows] = await execute(
      "SELECT id, username, email FROM users WHERE email = ?",
      [email],
    );
    return rows.length ? rows[0] : null;
  }
}

export default new Users();
