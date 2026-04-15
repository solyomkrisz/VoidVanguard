import Table from "../Table.js";
import Role from "../../common/Role.js";
import Permission from "../../common/Permission.js";
import Column from "../Column.js";
import { execute } from "../database.js";
import { runQueryWithPagination } from "../../common/common.js";
import * as CustomError from "../../common/CustomError.js";

class Saves extends Table {
  constructor() {
    super({
      columns: [
        new Column("id"),
        new Column("user_id"),
        new Column("slot_name").grant(Role.USER, Permission.W),
        new Column("game_state").grant(Role.USER, Permission.W),
        new Column("created_at"),
        new Column("updated_at"),
      ],
    });
  }

  async insert({ id, userId, slotName, gameState }) {
    const [result] = await execute(
      "INSERT INTO saves(id, user_id, slot_name, game_state) VALUES(?, ?, ?, ?)",
      [id, userId, slotName, gameState]
    );
    return result;
  }

  async getBySlotName(userId, slotName) {
    const [rows] = await execute(
      "SELECT * FROM saves WHERE user_id = ? AND slot_name = ?",
      [userId, slotName]
    );
    return rows.length ? rows : null;
  }

  async getById(saveId) {
    const [rows] = await execute("SELECT * FROM saves WHERE id = ?", [saveId]);
    return rows.length ? rows : null;
  }

  async getByIdForUser(saveId, userId) {
    const [rows] = await execute(
      "SELECT * FROM saves WHERE id = ? AND user_id = ?",
      [saveId, userId]
    );
    return rows.length ? rows : null;
  }
}

export default new Saves();
