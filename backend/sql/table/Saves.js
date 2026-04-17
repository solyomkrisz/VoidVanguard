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

  async insert({ id, userId, slotName, gameState, stateHash }) {
    const [result] = await execute(
      "INSERT INTO saves(id, user_id, slot_name, game_state, state_hash) VALUES(?, ?, ?, ?, ?)",
      [id, userId, slotName, gameState, stateHash],
    );
    return result;
  }

  async getBySlotName(userId, slotName) {
    const [rows] = await execute(
      "SELECT * FROM saves WHERE user_id = ? AND slot_name = ?",
      [userId, slotName],
    );
    return rows.length ? rows : null;
  }

  async selectById(saveId) {
    const [rows] = await execute("SELECT * FROM saves WHERE id = ?", [saveId]);
    return rows.length ? rows : null;
  }

  async selectByIdForUser(saveId, userId) {
    const [rows] = await execute(
      "SELECT * FROM saves WHERE id = ? AND user_id = ?",
      [saveId, userId],
    );
    return rows.length ? rows : null;
  }

  async countSavesForUserId(userId) {
    const [[{ count }]] = await execute(
      "SELECT COUNT(*) AS count FROM saves WHERE user_id = ?",
      [userId],
    );
    return count;
  }

  async lazySelectByUserId(userId, { limit = null, offset = null }) {
    const sql = `
      SELECT
        *,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM saves
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `;

    return await runQueryWithPagination(sql, [userId], {
      limit,
      offset,
    });
  }

  async delete(userId, saveId) {
    const [result] = await execute(
      "DELETE FROM saves WHERE id = ? AND user_id = ?",
      [saveId, userId],
    );
    return result;
  }

  async update(userId, saveId, updates) {
    const columns = Object.keys(updates);

    if (!columns.length) return false;

    const set = columns.map((i) => `${i} = ?`).join(",");
    const values = [...Object.values(updates), saveId, userId];

    const [result] = await execute(
      `UPDATE saves SET ${set} WHERE id = ? AND user_id = ?`,
      values,
    );

    return result.affectedRows > 0;
  }
}

export default new Saves();
