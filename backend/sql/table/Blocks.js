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
      [a_id, b_id]
    );

    if (rows.length) throw CustomError.INI_BLOCKED_REC;

    [rows] = await execute(
      "SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?",
      [b_id, a_id]
    );

    if (rows.length) throw CustomError.REC_BLOCKED_INI;

    return false;
  }

  async create(request) {
    const id = request.targetUser.id;
    const userId = request.body.userId;

    await Friends.delete(request);

    const [result] = await execute(
      "INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)",
      [id, userId]
    );

    return result;
  }

  async delete(request) {
    const id = request.targetUser.id;
    const userId = request.body.userId;

    const [result] = await execute(
      "DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?",
      [id, userId]
    );

    return result;
  }

  async getAllBlocked({ targetUser: { id } }) {
    const [rows] = await execute(
      "SELECT blocked_id FROM blocks WHERE blocker_id = ?",
      [id]
    );
    return rows;
  }
}

export default new Blocks();
