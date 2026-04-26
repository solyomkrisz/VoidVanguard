import bcrypt from "bcrypt";
import Table from "../Table.js";
import Column from "../Column.js";
import * as CustomError from "../../common/CustomError.js";
import { execute } from "../database.js";

class RefreshTokens extends Table {
  constructor() {
    super({
      columns: [
        new Column("user_id"),
        new Column("token_hash"),
        new Column("expires_at"),
        new Column("issued_at"),
        new Column("revoked"),
      ],
    });
  }

  async save({ userId, tokenHash, exp, iat }) {
    const [result] = await execute(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, issued_at) VALUES (?, ?, ?, ?)",
      [userId, tokenHash, exp, iat],
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
      "SELECT token_hash FROM refresh_tokens WHERE token_hash = ? AND revoked = FALSE AND expires_at > NOW()",
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
}

export default new RefreshTokens();
