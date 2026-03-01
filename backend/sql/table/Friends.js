const Table = require("../Table.js");
const Column = require("../Column.js");
const { execute } = require("../database.js");

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

  async status(request) {
    const a_id = request?.user?.id;
    const b_id = request?.params?.id;

    if (!a_id || !b_id) {
      return "not-friends";
    }

    const [rows] = await execute(
      "SELECT status FROM friends WHERE ((initiator_id = ? AND recipient_id = ?) OR (initiator_id = ? AND recipient_id = ?))",
      [a_id, b_id, b_id, a_id],
    );

    if (!rows.length) {
      return "not-friends";
    }

    return rows[0].status;
  }

  async exists(request) {
    const a_id = request?.user?.id;
    const b_id = request?.params?.id;

    if (!a_id || !b_id) {
      return false;
    }

    const [rows] = await execute(
      "SELECT 1 FROM friends WHERE ((initiator_id = ? AND recipient_id = ?) OR (initiator_id = ? AND recipient_id = ?)) AND status = 'accepted'",
      [a_id, b_id, b_id, a_id],
    );

    return !!rows.length;
  }

  async initiate({ targetUser, body }) {
    const [result] = await execute(
      "INSERT INTO friends (initiator_id, recipient_id) VALUES (?, ?)",
      [targetUser.id, body.userId],
    );
    return result;
  }

  async accept({ targetUser, body }) {
    const [result] = await execute(
      "UPDATE friends SET status = 'accepted' WHERE status = 'pending' AND initiator_id = ? AND recipient_id = ?",
      [body.userId, targetUser.id],
    );
    return result;
  }

  async delete({ targetUser: { id: a_id }, body: { userId: b_id } }) {
    const [result] = await execute(
      "DELETE FROM friends WHERE ((initiator_id = ? AND recipient_id = ?) OR (initiator_id = ? AND recipient_id = ?))",
      [a_id, b_id, b_id, a_id],
    );
    return result;
  }

  async getAllIncoming({ targetUser: { id } }) {
    const [rows] = await execute(
      "SELECT initiator_id FROM friends WHERE recipient_id = ? AND status = 'pending'",
      [id],
    );
    return rows;
  }

  async getAllPending({ targetUser: { id } }) {
    const [rows] = await execute(
      "SELECT recipient_id FROM friends WHERE initiator_id = ? AND status = 'pending'",
      [id],
    );
    return rows;
  }

  async getAll({ targetUser: { id } }) {
    const [rows] = await execute(
      `
        SELECT initiator_id FROM friends WHERE recipient_id = ? AND status = 'accepted'
        UNION
        SELECT recipient_id FROM friends WHERE initiator_id = ? AND status = 'accepted'
      `,
      [id, id],
    );
    return rows;
  }
}

module.exports = new Friends();
