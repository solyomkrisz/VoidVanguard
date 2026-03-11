const Table = require("../Table.js");
const Column = require("../Column.js");
const CustomError = require("../../common/CustomError.js");
const { execute } = require("../database.js");
const Role = require("../../common/Role.js");
const Permission = require("../../common/Permission.js");

class Reactions extends Table {
  constructor() {
    super({
      columns: [
        new Column("user_id"),
        new Column("comment_id"),
        new Column("type"),
      ],
    });
  }

  async select({ targetUser: { id }, params: { targetId } }) {
    const [rows] = await execute(
      "SELECT * FROM reactions WHERE user_id = ? AND target_id = ?",
      [id, targetId],
    );

    if (!rows.length) {
      return {
        target_id: targetId,
      };
    }

    return rows[0];
  }

  async create({ targetUser: { id }, body: { targetId, type } }) {
    const [result] = await execute(
      "INSERT INTO reactions (user_id, target_id, type) VALUES (?, ?, ?)",
      [id, targetId, type],
    );
    return result;
  }

  async delete({ targetUser: { id }, body: { targetId, type } }) {
    const [result] = await execute(
      "DELETE FROM reactions WHERE user_id = ? AND target_id = ? AND type = ?",
      [id, targetId, type],
    );
    return result;
  }

  async upsert({ targetUser: { id }, body: { targetId, type } }) {
    const [result] = await execute(
      "INSERT INTO reactions (user_id, target_id, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE type = VALUES(type)",
      [id, targetId, type],
    );
    return result;
  }
}

module.exports = new Reactions();
