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

  async save(id, token, exp, iat) {
    const tokenHash = await bcrypt.hash(token, 10);
    const [result] = await execute(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, issued_at) VALUES (?, ?, ?, ?)",
      [id, tokenHash, new Date(exp * 1000), new Date(iat * 1000)]
    );
    return result;
  }

  async revokeAll(id) {
    const [result] = await execute(
      "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ? AND revoked = FALSE",
      [id]
    );
    return result;
  }

  async deleteAll(id) {
    const [result] = await execute(
      "DELETE FROM refresh_tokens WHERE user_id = ?",
      [id]
    );
    return result;
  }

  async find(id, token) {
    const [rows] = await execute(
      "SELECT token_hash FROM refresh_tokens WHERE user_id = ? AND revoked = FALSE AND expires_at > NOW()",
      [id]
    );

    if (!rows.length) {
      throw CustomError.INVALID_TOKEN;
    }

    if (await bcrypt.compare(token, rows[0].token_hash)) {
      return rows[0];
    }

    throw CustomError.INVALID_TOKEN;
  }
}

export default new RefreshTokens();
