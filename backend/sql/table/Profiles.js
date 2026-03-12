import Table from "../Table.js";
import Column from "../Column.js";
import * as CustomError from "../../common/CustomError.js";
import { execute } from "../database.js";
import Role from "../../common/Role.js";
import Permission from "../../common/Permission.js";
import Blocks from "./Blocks.js";
import Friends from "./Friends.js";

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

  async like(request) {
    const [rows] = await execute(
      "SELECT user_id, avatar, display_name FROM profiles WHERE display_name LIKE ?",
      [`${request.query.search}%`]
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
      [id]
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
      "SELECT user_id, avatar, display_name, description, visibility FROM profiles WHERE user_id = ?",
      [id],
    );

    if (!rows.length) {
      throw CustomError.PROFILE_NOT_FOUND;
    }

    const { user_id, avatar, display_name, description, visibility } = rows[0];

    const friendship_status = await Friends.status(request);
    let is_blocked = false;

    try {
      await Blocks.exists(request);
    } catch (_) {
      is_blocked = true;
    }

    const all_friends = await Friends.getAll(request);
    
    if (
      id === request?.user?.id ||
      (visibility === "friends-only" && friendship_status === "accepted") ||
      visibility === "public" ||
      request?.user?.role >= Role.ADMIN
    ) {
      return { user_id, avatar, display_name, description, friendship_status, is_blocked, all_friends };
    }

    return { user_id, avatar, display_name, description: "", friendship_status, is_blocked, all_friends };
  }

  async create({ targetUser: { id, role }, body }) {
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

  async update({ targetUser: { id, role }, body }) {
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

  async delete({ targetUser: { id } }) {
    const [result] = await execute("DELETE FROM entities WHERE id = ?", [id]);
    return result;
  }
}

export default new Profiles();
