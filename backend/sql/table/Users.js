import Table from "../Table.js";
import Role from "../../common/Role.js";
import Permission from "../../common/Permission.js";
import Column from "../Column.js";
import { execute } from "../database.js";
import * as CustomError from "../../common/CustomError.js";
import Password from "../../common/Password.js";
import { v4 as uuidv4 } from "uuid";

class Users extends Table {
  constructor() {
    super({
      columns: [
        new Column("id"),
        new Column("username").grant(Role.USER, Permission.W),
        new Column("role").grant(Role.ADMIN, Permission.W),
        new Column("email").grant(Role.USER, Permission.W),
        new Column("gender").grant(Role.USER, Permission.W),
        new Column("password").grant(Role.USER, Permission.W),
        new Column("created_at"),
      ],
    });
  }

  async exists(id) {
    const [rows] = await execute("SELECT 1 FROM users WHERE id = ?", [id]);
    return !!rows.length;
  }

  async payload(id) {
    const [rows] = await execute(
      "SELECT id, username, role FROM users WHERE id = ?",
      [id]
    );
    return rows.length ? rows[0] : null;
  }

  async create({ body: { username, email, gender, password } }) {
    const passwordHash = await Password.hash(password);

    const [result] = await execute(
      "INSERT INTO users (id, username, email, gender, password_hash) VALUES (?, ?, ?, ?, ?)",
      [uuidv4(), username, email, gender, passwordHash]
    );

    return result;
  }

  async delete({ targetUser: { id } }) {
    const [result] = await execute("DELETE FROM users WHERE id = ?", [id]);
    return result;
  }

  async login({ body: { username, password } }) {
    const [rows] = await execute(
      "SELECT id, username, role, password_hash FROM users WHERE username = ?",
      [username]
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

  async _select(id) {
    const [rows] = await execute("SELECT * FROM users WHERE id = ?", [id]);
    if (!rows.length) {
      throw CustomError.USER_NOT_FOUND;
    }
    return rows[0];
  }

  async update({ targetUser: { id, role }, body }) {
    const data = await this._select(id);

    let query = "UPDATE users SET ";
    const values = [];

    for (const column of Object.keys(body)) {
      if (!this.hasPermission(column, role, Permission.W)) {
        continue;
      }

      if (column === "password") {
        if (await Password.compare(body[column], data.password_hash)) {
          continue;
        }

        query += "password_hash = ?, ";
        values.push(await Password.hash(body[column]));

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

    query = query.slice(0, -2) + " WHERE id = ?";
    values.push(id);

    const [result] = await execute(query, values);
    return result;
  }
}

export default new Users();
