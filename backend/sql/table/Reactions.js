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

  async create({
    targetUser: { id },
    body: { targetType, targetId, reactionType },
  }) {
    const [result] = await execute(
      "INSERT INTO reactions (user_id, target_type, target_id type) VALUES (?, ?, ?, ?)",
      [id, targetType, targetId, reactionType],
    );
    return result;
  }

  async delete({ targetUser: { id }, body: { targetId, reactionType } }) {
    const [result] = await execute(
      "DELETE FROM reactions WHERE user_id = ? AND target_id = ? AND type = ?",
      [id, targetId, reactionType],
    );
    return result;
  }

  async upsert({
    targetUser: { id },
    body: { targetType, targetId, reactionType },
  }) {
    const [result] = await execute(
      "INSERT INTO reactions (user_id, target_type, target_id, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE type = VALUES(type)",
      [id, targetType, targetId, reactionType],
    );
    return result;
  }
}

module.exports = new Reactions();
