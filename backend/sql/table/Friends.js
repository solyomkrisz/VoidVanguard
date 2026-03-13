import Table from "../Table.js";
import Column from "../Column.js";
import { execute } from "../database.js";

class Friends extends Table {
  constructor() {
    super({
      columns: [
        new Column("id"),
        new Column("initiator_id"),
        new Column("recipient_id"),
        new Column("status"),
        new Column("created_at"),
        new Column("updated_at"),
      ],
    });
  }

  async get(aId, bId) {
    const [rows] = await execute(
      `
        SELECT status, initiator_id
        FROM friends
        WHERE (initiator_id = ? AND recipient_id = ?)
           OR (initiator_id = ? AND recipient_id = ?)
      `,
      [aId, bId, bId, aId],
    );

    return rows[0] || null;
  }

  async exists(aId, bId) {
    const row = await this.get(aId, bId);
    return row?.status === "accepted";
  }

  async initiate(initiatorId, recipientId) {
    const [result] = await execute(
      "INSERT INTO friends (initiator_id, recipient_id) VALUES (?, ?)",
      [initiatorId, recipientId],
    );
    return result;
  }

  async accept(initiatorId, recipientId) {
    const [result] = await execute(
      "UPDATE friends SET status = 'accepted' WHERE status = 'pending' AND initiator_id = ? AND recipient_id = ?",
      [initiatorId, recipientId],
    );
    return result;
  }

  async delete(aId, bId) {
    const [result] = await execute(
      `
        DELETE FROM friends
        WHERE (initiator_id = ? AND recipient_id = ?)
           OR (initiator_id = ? AND recipient_id = ?)
      `,
      [aId, bId, bId, aId],
    );
    return result;
  }

  async countAll(userId) {
    const [[{ count }]] = await execute(
      "SELECT COUNT(*) as count FROM friends WHERE (initiator_id = ? OR recipient_id = ?) AND status = 'accepted'",
      [userId, userId],
    );

    return count;
  }

  async getAllIncoming(userId) {
    const [rows] = await execute(
      "SELECT initiator_id FROM friends WHERE recipient_id = ? AND status = 'pending'",
      [userId],
    );
    return rows;
  }

  async countAllIncoming(userId) {
    const [[{ count }]] = await execute(
      "SELECT COUNT(*) as count FROM friends WHERE recipient_id = ? AND status = 'pending'",
      [userId],
    );
    return count;
  }

  async getAllPending(userId) {
    const [rows] = await execute(
      "SELECT recipient_id FROM friends WHERE initiator_id = ? AND status = 'pending'",
      [userId],
    );
    return rows;
  }

  async countAllPending(userId) {
    const [[{ count }]] = await execute(
      "SELECT COUNT(*) AS count FROM friends WHERE initiator_id = ? AND status = 'pending'",
      [userId],
    );
    return count;
  }

  async getAll(userId) {
    const [rows] = await execute(
      `
        SELECT friends.initiator_id, COALESCE(profiles.display_name, users.username) AS name
        FROM friends
        INNER JOIN users ON users.id = friends.initiator_id
        LEFT JOIN profiles ON profiles.user_id = users.id
        WHERE recipient_id = ? AND status = 'accepted'

        UNION

        SELECT friends.recipient_id, COALESCE(profiles.display_name, users.username) AS name
        FROM friends
        INNER JOIN users ON users.id = friends.recipient_id
        LEFT JOIN profiles ON profiles.user_id = users.id
        WHERE initiator_id = ? AND status = 'accepted'
      `,
      [userId, userId],
    );

    return rows;
  }
}

export default new Friends();
