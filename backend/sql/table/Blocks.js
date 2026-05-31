/**
 * Kezdobarat magyarazat:
 * Fajl: backend/sql/table/Blocks.js
 * Szerep: Adatbazis reteg: SQL schema, tabla-modellek, oszlop- es kapcsolatkezeles.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Table from "../Table.js";
import Column from "../Column.js";
import * as CustomError from "../../common/CustomError.js";
import { execute } from "../database.js";
import Friends from "./Friends.js";

class Blocks extends Table {
  constructor() {
    super({
      columns: [
        new Column("blocker_id"),
        new Column("blocked_id"),
        new Column("created_at"),
      ],
    });
  }

  async exists(request) {
    const a_id = request?.targetUser.id;
    const b_id = request?.body?.userId || request?.params?.id;

    if (!a_id || !b_id) return false;

    let rows;

    [rows] = await execute(
      "SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?",
      [a_id, b_id],
    );

    if (rows.length) throw CustomError.INI_BLOCKED_REC;

    [rows] = await execute(
      "SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?",
      [b_id, a_id],
    );

    if (rows.length) throw CustomError.REC_BLOCKED_INI;

    return false;
  }

  async isBlocked(blockerId, blockedId) {
    const [rows] = await execute(
      "SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?",
      [blockerId, blockedId],
    );
    return !!rows.length;
  }

  async create(blockerId, blockedId) {
    const [result] = await execute(
      "INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)",
      [blockerId, blockedId],
    );
    return result;
  }

  async delete(blockerId, blockedId) {
    const [result] = await execute(
      "DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?",
      [blockerId, blockedId],
    );
    return result;
  }

  async getAllBlocked(blockerId) {
    const [rows] = await execute(
      "SELECT blocked_id FROM blocks WHERE blocker_id = ?",
      [blockerId],
    );
    return rows;
  }

  async count(blockerId) {
    const [[{ count }]] = await execute(
      "SELECT COUNT(*) AS count FROM blocks WHERE blocker_id = ?",
      [blockerId],
    );
    return count;
  }

  async lazySelectByTarget(blockerId, { limit = null, offset = null } = {}) {
    const limitClause = limit != null ? "LIMIT ?" : "";
    const offsetClause = offset != null ? "OFFSET ?" : "";

    const query = `
      SELECT
        blocks.blocked_id AS user_id,
        profiles.avatar,
        COALESCE(profiles.display_name, users.username) AS name
      FROM blocks
      INNER JOIN users ON users.id = blocks.blocked_id
      LEFT JOIN profiles ON profiles.user_id = users.id
      WHERE blocker_id = ?
      ${limitClause}
      ${offsetClause}
    `;

    const params = [blockerId];

    if (limit != null) params.push(limit);
    if (offset != null) params.push(offset);

    const [rows] = await execute(query, params);
    return rows;
  }
}

export default new Blocks();
