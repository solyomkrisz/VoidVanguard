import bcrypt from "bcrypt";
import Table from "../Table.js";
import Column from "../Column.js";
import * as CustomError from "../../common/CustomError.js";
import { runQueryWithPagination } from "../../common/common.js";
import { execute } from "../database.js";

class RefreshTokens extends Table {
  constructor() {
    super({
      columns: [
        new Column("id"),
        new Column("user_id"),
        new Column("token_hash"),
        new Column("expires_at"),
        new Column("issued_at"),
        new Column("last_used_at"),
        new Column("ip"),
        new Column("user_agent"),
        new Column("revoked"),
      ],
    });
  }

  async save({ id, userId, tokenHash, exp, iat, ip, userAgent }) {
    const [result] = await execute(
      "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, issued_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, userId, tokenHash, exp, iat, ip, userAgent],
    );
    return result;
  }

  async revokeAll(id) {
    const [result] = await execute(
      "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ? AND revoked = FALSE",
      [id],
    );
    return result;
  }

  async deleteAll(id) {
    const [result] = await execute(
      "DELETE FROM refresh_tokens WHERE user_id = ?",
      [id],
    );
    return result;
  }

  async findForUser(userId) {
    const [rows] = await execute(
      "SELECT token_hash FROM refresh_tokens WHERE user_id = ? AND revoked = FALSE AND expires_at > NOW()",
      [userId],
    );
    return rows.length ? rows[0] : null;
  }

  async findByHash(tokenHash) {
    const [rows] = await execute(
      "SELECT id, token_hash FROM refresh_tokens WHERE token_hash = ? AND revoked = FALSE AND expires_at > NOW()",
      [tokenHash],
    );
    return rows.length ? rows[0] : null;
  }

  async deleteByTokenHash(tokenHash) {
    const [result] = await execute(
      "DELETE FROM refresh_tokens WHERE token_hash = ?",
      [tokenHash],
    );
    return result;
  }

  async lazySelectActiveByUserId(
    userId,
    tokenHash = null,
    { limit = null, offset = null },
  ) {
    const sql = `
      SELECT
        id,
        ip,
        user_agent,
        DATE_FORMAT(last_used_at, '%Y-%m-%d %H:%i:%s') AS last_used_at,
        DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i:%s') AS expires_at,
        DATE_FORMAT(issued_at, '%Y-%m-%d %H:%i:%s') AS issued_at,
        CASE
          WHEN ? IS NOT NULL AND token_hash = ?
          THEN TRUE
          ELSE FALSE
        END AS current
      FROM refresh_tokens
      WHERE user_id = ? AND revoked = FALSE
    `;

    const rows = await runQueryWithPagination(
      sql,
      [tokenHash, tokenHash, userId],
      {
        limit,
        offset,
      },
    );

    return rows;
  }

  async getTotalActiveTokensByUserId(userId) {
    const [[{ count }]] = await execute(
      "SELECT COUNT(*) AS count FROM refresh_tokens WHERE user_id = ? AND revoked = FALSE",
      [userId],
    );
    return count;
  }

  async deleteById(id, userId) {
    const [result] = await execute(
      "DELETE FROM refresh_tokens WHERE id = ? AND user_id = ?",
      [id, userId],
    );
    return result;
  }

  async updateLastUsedAt(tokenHash) {
    const [result] = await execute(
      "UPDATE refresh_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token_hash = ?",
      [tokenHash],
    );
    return result;
  }
}

export default new RefreshTokens();
