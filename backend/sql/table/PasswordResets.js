/**
 * Kezdobarat magyarazat:
 * Fajl: backend/sql/table/PasswordResets.js
 * Szerep: Adatbazis reteg: SQL schema, tabla-modellek, oszlop- es kapcsolatkezeles.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Table from "../Table.js";
import Role from "../../common/Role.js";
import Permission from "../../common/Permission.js";
import Column from "../Column.js";
import { execute } from "../database.js";
import { runQueryWithPagination } from "../../common/common.js";
import * as CustomError from "../../common/CustomError.js";

class PasswordResets extends Table {
  constructor() {
    super({
      columns: [
        new Column("user_id"),
        new Column("token_hash"),
        new Column("expires_at"),
        new Column("issued_at"),
      ],
    });
  }

  async canRequestPasswordReset(userId) {
    const [rows] = await execute(
      `
      SELECT 1
      FROM password_resets
      WHERE user_id = ?
        AND issued_at > NOW() - INTERVAL 5 MINUTE
      LIMIT 1
    `,
      [userId],
    );
    return rows.length ? false : true;
  }

  async getValidRowByTokenHash(tokenHash) {
    const [rows] = await execute(
      "SELECT * FROM password_resets WHERE token_hash = ? AND expires_at > NOW() LIMIT 1;",
      [tokenHash],
    );
    return rows.length ? rows[0] : null;
  }

  async removeRowByTokenHash(tokenHash) {
    const [result] = await execute(
      "DELETE FROM password_resets WHERE token_hash = ?",
      [tokenHash],
    );
    return result;
  }

  async insert(userId, tokenHash, expiresAt) {
    const [result] = await execute(
      "INSERT INTO password_resets(user_id, token_hash, expires_at) VALUES(?, ?, ?)",
      [userId, tokenHash, expiresAt],
    );
    return result;
  }

  async _select(userId) {
    const [rows] = await execute(
      "SELECT * FROM password_resets WHERE user_id = ?",
      [userId],
    );
    return rows.length ? rows[0] : null;
  }

  async upsert({ userId, tokenHash, expiresAt }) {
    const [result] = await execute(
      `
      INSERT INTO password_resets(user_id, token_hash, expires_at)
      VALUES(?, ?, ?)
      ON DUPLICATE KEY UPDATE
        token_hash = VALUES(token_hash),
        expires_at = VALUES(expires_at)
    `,
      [userId, tokenHash, expiresAt],
    );
    return result;
  }

  async hasPending({ userId }) {
    const [rows] = await execute(
      "SELECT * FROM password_resets WHERE user_id = ? AND expires_at > NOW()",
      [userId],
    );
    return rows.length ? rows[0] : null;
  }
}

export default new PasswordResets();
