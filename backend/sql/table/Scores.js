/**
 * Kezdobarat magyarazat:
 * Fajl: backend/sql/table/Scores.js
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

class Scores extends Table {
  constructor() {
    super({
      columns: [
        new Column("game_id"),
        new Column("score").grant(Role.USER, Permission.W),
        new Column("created_at"),
        new Column("updated_at"),
      ],
    });
  }

  async selectUserScoreWithRankForSpecificGame(gameId, userId) {
    const [rows] = await execute(
      `
      SELECT
        t.user_id,
        t.score,
        t.rank
      FROM (
        SELECT
          sa.user_id,
          s.score,
          RANK() OVER (ORDER BY s.score DESC) AS rank
        FROM scores s
        INNER JOIN saves sa ON sa.game_id = s.game_id
        WHERE s.game_id = ?
      ) t
      WHERE t.user_id = ?
    `,
      [gameId, userId],
    );

    return rows.length ? rows[0] : null;
  }

  async selectBestUserScoreWithRank(userId) {
    const [rows] = await execute(
      `
      SELECT
        t.user_id,
        t.best_score,
        u.username AS name,
        t.rank
      FROM (
        SELECT
          sa.user_id,
          MAX(s.score) AS best_score,
          RANK() OVER (ORDER BY MAX(s.score) DESC) AS rank
        FROM scores s
        INNER JOIN saves sa ON sa.game_id = s.game_id
        GROUP BY sa.user_id
      ) t
      INNER JOIN users u ON u.id = t.user_id
      WHERE t.user_id = ?
    `,
      [userId],
    );

    return rows.length ? rows[0] : null;
  }

  async lazySelectBestUserScoresWithoutRankPublic({
    limit = null,
    offset = null,
  }) {
    const sql = `
      SELECT
        t.user_id,
        u.username AS name,
        t.best_score
      FROM (
        SELECT 
          sa.user_id,
          MAX(s.score) AS best_score
        FROM scores s
        INNER JOIN saves sa ON sa.game_id = s.game_id
        GROUP BY sa.user_id
      ) t
      INNER JOIN users u ON u.id = t.user_id
      ORDER BY t.best_score DESC, t.user_id ASC
    `;

    const rows = await runQueryWithPagination(sql, [], { limit, offset });

    return rows;
  }

  async getTotalBestScoresPublic() {
    const [[{ count }]] = await execute(
      `
      SELECT COUNT(DISTINCT sa.user_id) AS count
      FROM scores s
      INNER JOIN saves sa ON sa.game_id = s.game_id
    `,
    );

    return count;
  }

  async lazySelectBestUserScoresWithoutRankPrivate(
    userId,
    { limit = null, offset = null },
  ) {
    const sql = `
      SELECT 
        sa.user_id,
        u.username AS name,
        MAX(s.score) AS best_score
      FROM scores s
      INNER JOIN saves sa ON sa.game_id = s.game_id
      INNER JOIN users u ON u.id = sa.user_id
      LEFT JOIN friends f
        ON (
          (f.initiator_id = ? AND f.recipient_id = sa.user_id)
          OR
          (f.recipient_id = ? AND f.initiator_id = sa.user_id)
        )
      WHERE 
        (f.status = 'accepted')
        OR sa.user_id = ?
      GROUP BY sa.user_id, u.username
      ORDER BY best_score DESC, sa.user_id ASC
    `;

    const rows = await runQueryWithPagination(sql, [userId, userId, userId], {
      limit,
      offset,
    });

    return rows;
  }

  async getTotalBestScoresPrivate(userId) {
    const [[{ count }]] = await execute(
      `
      SELECT COUNT(DISTINCT sa.user_id) AS count
      FROM scores s
      INNER JOIN saves sa ON sa.game_id = s.game_id
      INNER JOIN friends f
        ON (
          (f.initiator_id = ? AND f.recipient_id = sa.user_id)
          OR
          (f.recipient_id = ? AND f.initiator_id = sa.user_id)
        )
      WHERE f.status = 'accepted';
    `,
      [userId, userId],
    );

    return count;
  }

  async select(gameId) {
    const [rows] = await execute(
      `
      SELECT *
      FROM scores
      WHERE game_id = ?
    `,
      [gameId],
    );

    return rows.length ? rows[0] : null;
  }

  async insert(gameId, score) {
    const [result] = await execute(
      "INSERT INTO scores(game_id, score) VALUES(?, ?)",
      [gameId, score],
    );
    return result;
  }

  async delete(gameId) {
    const [result] = await execute("DELETE FROM scores WHERE game_id = ?", [
      gameId,
    ]);
    return result;
  }

  async update(gameId, score) {
    const [result] = await execute(
      "UPDATE scores SET score = ? WHERE game_id = ?",
      [score, gameId],
    );
    return result;
  }
}

export default new Scores();
