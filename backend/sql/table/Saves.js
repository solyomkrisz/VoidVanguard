/**
 * Kezdobarat magyarazat:
 * Fajl: backend/sql/table/Saves.js
 * Szerep: Adatbazis reteg: SQL schema, tabla-modellek, oszlop- es kapcsolatkezeles.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
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
        new Column("game_id"),
        new Column("user_id"),
        new Column("save_name").grant(Role.USER, Permission.W),
        new Column("game_state").grant(Role.USER, Permission.W),
        new Column("is_finished").grant(Role.USER, Permission.W),
        new Column("created_at"),
        new Column("updated_at"),
      ],
    });
  }

  async insert({ gameId, userId, saveName, gameState }) {
    const [result] = await execute(
      "INSERT INTO saves(game_id, user_id, save_name, game_state) VALUES(?, ?, ?, ?)",
      [gameId, userId, saveName, gameState],
    );
    return result;
  }

  async getBySaveName(userId, saveName) {
    const [rows] = await execute(
      "SELECT * FROM saves WHERE user_id = ? AND save_name = ?",
      [userId, saveName],
    );
    return rows.length ? rows : null;
  }

  async selectById(gameId) {
    const [rows] = await execute("SELECT * FROM saves WHERE game_id = ?", [
      gameId,
    ]);
    return rows.length ? rows : null;
  }

  async selectByIdForUser(gameId, userId) {
    const [rows] = await execute(
      "SELECT * FROM saves WHERE game_id = ? AND user_id = ?",
      [gameId, userId],
    );
    return rows.length ? rows[0] : null;
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

  async delete(userId, gameId) {
    const [result] = await execute(
      "DELETE FROM saves WHERE game_id = ? AND user_id = ?",
      [gameId, userId],
    );
    return result;
  }

  async update(userId, gameId, updates) {
    const columns = Object.keys(updates);

    if (!columns.length) return false;

    const set = columns.map((i) => `${i} = ?`).join(",");
    const values = [...Object.values(updates), gameId, userId];

    const [result] = await execute(
      `UPDATE saves SET ${set} WHERE game_id = ? AND user_id = ?`,
      values,
    );

    return result;
  }
}

export default new Saves();
