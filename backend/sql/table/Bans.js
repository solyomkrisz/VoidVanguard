import Table from "../Table.js";
import Column from "../Column.js";
import * as CustomError from "../../common/CustomError.js";
import { execute } from "../database.js";
import Friends from "./Friends.js";

class Bans extends Table {
  constructor() {
    super({
      columns: [
        new Column("id"),
        new Column("user_id"),
        new Column("reason"),
        new Column("created_at"),
        new Column("expires_at"),
        new Column("revoked_at"),
        new Column("created_by"),
        new Column("revoked_by"),
      ],
    });
  }

  async isBanned(userId) {
    const [rows] = await execute(
      `
        SELECT reason
        FROM bans
        WHERE user_id = ?
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
        `,
      [userId],
    );
    return rows.length ? rows[0] : null;
  }

  async banUser({ id, userId, reason, expiresAt, createdBy } = {}) {
    const [result] = await execute(
      `
        INSERT INTO bans(id, user_id, reason, expires_at, created_by)
        VALUES(?, ?, ?, ?, ?)
    `,
      [id, userId, reason, expiresAt ?? null, createdBy],
    );
    return result;
  }

  // feltételezzük hogy egy ban lehet
  async unBanUser(userId, adminId) {
    const [result] = await execute(
      `
        UPDATE bans
        SET revoked_at = NOW(),
            revoked_by = ?
        WHERE user_id = ?
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
    `,
      [adminId, userId],
    );

    return result.affectedRows > 0;
  }
}

export default new Bans();
