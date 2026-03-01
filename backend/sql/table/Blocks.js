const Table = require("../Table.js");
const Column = require("../Column.js");
const CustomError = require("../../common/CustomError.js");
const { execute } = require("../database.js");

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

  async create({ targetUser: { id }, body: { userId } }) {
    const [result] = await execute(
      "INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)",
      [id, userId],
    );
    return result;
  }

  async delete({ targetUser: { id }, body: { userId } }) {
    const [result] = await execute(
      "DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?",
      [id, userId],
    );
    return result;
  }

  async getAllBlocked({ targetUser: { id } }) {
    const [rows] = await execute(
      "SELECT blocked_id FROM blocks WHERE blocker_id = ?",
      [id],
    );
    return rows;
  }
}

module.exports = new Blocks();
