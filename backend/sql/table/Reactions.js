import Table from "../Table.js";
import Column from "../Column.js";
import { execute } from "../database.js";

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
      [id, targetId]
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
      [id, targetId, type]
    );
    return result;
  }

  async delete({ targetUser: { id }, body: { targetId, type } }) {
    const [result] = await execute(
      "DELETE FROM reactions WHERE user_id = ? AND target_id = ? AND type = ?",
      [id, targetId, type]
    );
    return result;
  }

  async upsert({ targetUser: { id }, body: { targetId, type } }) {
    const [result] = await execute(
      "INSERT INTO reactions (user_id, target_id, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE type = VALUES(type)",
      [id, targetId, type]
    );
    return result;
  }
}

export default new Reactions();
