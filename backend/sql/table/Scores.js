import Table from "../Table.js";
import Role from "../../common/Role.js";
import Permission from "../../common/Permission.js";
import Column from "../Column.js";
import { execute } from "../database.js";
import { runQueryWithPagination } from "../../common/common.js";
import * as CustomError from "../../common/CustomError.js";

class Scores extends Table {
  constructor() {
    super({
      columns: [
        new Column("game_id"),
        new Column("user_id"),
        new Column("score").grant(Role.USER, Permission.W),
        new Column("created_at"),
        new Column("updated_at"),
      ],
    });
  }

  async select(gameId, userId) {
    const [rows] = await execute(
      "SELECT * FROM scores WHERE game_id = ? AND user_id = ?",
      [gameId, userId]
    );
    return rows.length ? rows[0] : null;
  }

  async insert(gameId, userId, score) {
    const [result] = await execute(
      "INSERT INTO scores(game_id, user_id, score) VALUES(?, ?, ?)",
      [gameId, userId, score]
    );
    return result;
  }

  async delete(gameId, userId) {
    const [result] = await execute(
      "DELETE FROM scores WHERE game_id = ? AND user_id = ?",
      [(gameId, userId)]
    );
    return result;
  }

  async update(gameId, userId, score) {
    const [result] = await execute(
      "UPDATE scores SET score = ? WHERE game_id = ? AND user_id = ?",
      [score, gameId, userId]
    );
    return result;
  }
}

export default new Scores();
