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

  async select(userId, targetId) {
    const [rows] = await execute(
      "SELECT * FROM reactions WHERE user_id = ? AND target_id = ?",
      [userId, targetId],
    );
    return rows[0] ?? null;
  }

  async create(userId, targetId, reactionType) {
    const [result] = await execute(
      "INSERT INTO reactions (user_id, target_id, type) VALUES (?, ?, ?)",
      [userId, targetId, reactionType],
    );
    return result;
  }

  async update(userId, targetId, reactionType) {
    const [result] = await execute(
      "UPDATE reactions SET type = ? WHERE user_id = ? AND target_id = ?",
      [reactionType, userId, targetId],
    );
    return result;
  }

  async deleteByUserAndTarget(userId, targetId) {
    const [result] = await execute(
      "DELETE FROM reactions WHERE user_id = ? AND target_id = ?",
      [userId, targetId],
    );
    return result;
  }

  async delete(userId, targetId, reactionType) {
    const [result] = await execute(
      "DELETE FROM reactions WHERE user_id = ? AND target_id = ? AND type = ?",
      [userId, targetId, reactionType],
    );
    return result;
  }

  async upsert(userId, targetId, reactionType) {
    const [result] = await execute(
      "INSERT INTO reactions (user_id, target_id, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE type = VALUES(type)",
      [userId, targetId, reactionType],
    );
    return result;
  }
}

export default new Reactions();
