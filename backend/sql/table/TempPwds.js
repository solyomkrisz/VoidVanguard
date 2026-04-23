import Table from "../Table.js";
import Role from "../../common/Role.js";
import Permission from "../../common/Permission.js";
import Column from "../Column.js";
import { execute } from "../database.js";
import { runQueryWithPagination } from "../../common/common.js";
import * as CustomError from "../../common/CustomError.js";

class TempPwds extends Table {
  constructor() {
    super({
      columns: [
        new Column("user_id"),
        new Column("password_hash"),
        new Column("expires_at"),
        new Column("issued_at"),
      ],
    });
  }

  async insert(userId, passwordHash, expiresAt) {
    const [result] = await execute(
      "INSERT INTO temp_pwds(user_id, password_hash, expires_at) VALUES(?, ?, ?)",
      [userId, passwordHash, expiresAt],
    );
    return result;
  }

  async _select(userId) {
    const [rows] = await execute("SELECT * FROM temp_pwds WHERE user_id = ?", [
      userId,
    ]);
    return rows.length ? rows[0] : null;
  }
}

export default new TempPwds();
