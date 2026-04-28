import Table from "../Table.js";
import Column from "../Column.js";
import { runQueryWithPagination } from "../../common/common.js";
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
        SELECT
            reason,
            DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i:%s') AS expires_at
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

  async lazySelectByUserId(userId, { limit = null, offset = null }) {
    const sql = `
        SELECT
            b.id,
            b.user_id,
            b.reason,
            DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
            DATE_FORMAT(b.expires_at, '%Y-%m-%d %H:%i:%s') AS expires_at,
            DATE_FORMAT(b.revoked_at, '%Y-%m-%d %H:%i:%s') AS revoked_at,

            b.created_by,
            cb.username AS created_by_name,

            b.revoked_by,
            rb.username AS revoked_by_name

        FROM bans b

        LEFT JOIN users cb ON cb.id = b.created_by
        LEFT JOIN users rb ON rb.id = b.revoked_by

        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    `;

    const rows = await runQueryWithPagination(sql, [userId], {
      limit,
      offset,
    });

    return rows;
  }

  async getTotalBansForUser(userId) {
    const [[{ count }]] = await execute(
      "SELECT COUNT(*) AS count FROM bans WHERE user_id = ?",
      [userId],
    );

    return count;
  }
}

export default new Bans();
