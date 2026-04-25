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

  async selectUserScoreWithRankForSpecificGame(gameId, userId) {
    const [rows] = await execute(
      `
      SELECT
        s1.user_id,
        s1.score,
        COUNT(*) + 1 AS rank
      FROM scores s1
      JOIN scores s2 ON s2.score > s1.score
      WHERE
        s1.user_id = ? AND
        s1.game_id = ?
      GROUP BY s1.user_id, s1.score;
    `,
      [userId, gameId],
    );
    return rows.length ? rows[0] : null;
  }

  async selectBestUserScoreWithRank(userId) {
    const [rows] = await execute(
      `
        SELECT
          s.user_id,
          MAX(s.score) AS best_score,
          COALESCE(p.display_name, u.username) AS name,
          RANK() OVER (ORDER BY MAX(s.score) DESC) AS rank
        FROM scores s
        INNER JOIN users u ON u.id = s.user_id
        LEFT JOIN profiles p ON p.user_id = u.id
        GROUP BY s.user_id, u.username, p.display_name
        HAVING s.user_id = ?
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
        COALESCE(p.display_name, u.username) AS name,
        t.best_score
      FROM (
        SELECT user_id, MAX(score) AS best_score
        FROM scores
        GROUP BY user_id
      ) t
      INNER JOIN users u ON u.id = t.user_id
      LEFT JOIN profiles p ON p.user_id = u.id
      ORDER BY t.best_score DESC
    `;

    const rows = await runQueryWithPagination(sql, [], { limit, offset });

    return rows;
  }

  async getTotalBestScoresPublic() {
    const [[{ count }]] = await execute(
      "SELECT COUNT(DISTINCT user_id) AS count FROM scores;",
    );
    return count;
  }

  async lazySelectBestUserScoresWithoutRankPrivate(
    userId,
    { limit = null, offset = null },
  ) {
    const sql = `
      SELECT 
        scores.user_id,
        COALESCE(p.display_name, u.username) AS name,
        MAX(scores.score) AS best_score
      FROM scores
      INNER JOIN users u ON u.id = scores.user_id
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN friends
        ON (
          (friends.initiator_id = ? AND friends.recipient_id = scores.user_id)
          OR
          (friends.recipient_id = ? AND friends.initiator_id = scores.user_id)
        )
      WHERE 
        (friends.status = 'accepted')
        OR scores.user_id = ?
      GROUP BY scores.user_id, u.username, p.display_name
      ORDER BY best_score DESC
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
      SELECT COUNT(DISTINCT scores.user_id) AS count
      FROM scores
      INNER JOIN friends
        ON (
          (friends.initiator_id = ? AND friends.recipient_id = scores.user_id)
          OR
          (friends.recipient_id = ? AND friends.initiator_id = scores.user_id)
        )
      WHERE friends.status = 'accepted';
      `,
      [userId, userId],
    );

    return count;
  }

  async select(gameId, userId) {
    const [rows] = await execute(
      "SELECT * FROM scores WHERE game_id = ? AND user_id = ?",
      [gameId, userId],
    );
    return rows.length ? rows[0] : null;
  }

  async insert(gameId, userId, score) {
    const [result] = await execute(
      "INSERT INTO scores(game_id, user_id, score) VALUES(?, ?, ?)",
      [gameId, userId, score],
    );
    return result;
  }

  async delete(gameId, userId) {
    const [result] = await execute(
      "DELETE FROM scores WHERE game_id = ? AND user_id = ?",
      [(gameId, userId)],
    );
    return result;
  }

  async update(gameId, userId, score) {
    const [result] = await execute(
      "UPDATE scores SET score = ? WHERE game_id = ? AND user_id = ?",
      [score, gameId, userId],
    );
    return result;
  }
}

export default new Scores();
