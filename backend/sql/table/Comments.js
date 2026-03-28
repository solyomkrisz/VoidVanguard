import Table from "../Table.js";
import Column from "../Column.js";
import { execute } from "../database.js";
import Role from "../../common/Role.js";
import Permission from "../../common/Permission.js";

class Comments extends Table {
  constructor() {
    super({
      columns: [
        new Column("id"),
        new Column("author_id"),
        new Column("target_type"),
        new Column("target_id"),
        new Column("parent_comment_id"),
        new Column("content").grant(Role.USER, Permission.W),
        new Column("created_at"),
        new Column("updated_at"),
      ],
    });
  }

  async exists(id) {
    const [rows] = await execute("SELECT 1 FROM comments WHERE id = ?", [id]);
    return !!rows.length;
  }

  async lazySelectByTarget(requesterId, targetId, limit, offset) {
    const [rows] = await execute(
      `
        SELECT

          comments.*,
          DATE_FORMAT(comments.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
          DATE_FORMAT(comments.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
          username AS author,

          user_reaction.type AS user_reaction_type,

          COUNT(DISTINCT likes.user_id) AS likes,
          COUNT(DISTINCT dislikes.user_id) AS dislikes

        FROM comments

        INNER JOIN users ON users.id = comments.author_id

        LEFT JOIN reactions AS likes
          ON likes.target_id = comments.id AND likes.type = 'like'
        
        LEFT JOIN reactions as dislikes
          ON dislikes.target_id = comments.id AND dislikes.type = 'dislike'

        LEFT JOIN reactions AS user_reaction
          ON user_reaction.target_id = comments.id
          AND user_reaction.user_id = ?

        WHERE comments.target_id = ?

        GROUP BY comments.id
        ORDER BY created_at DESC, comments.id
        DESC LIMIT ? OFFSET ?
      `,
      [requesterId ?? -1, targetId, limit, offset],
    );

    return rows;
  }

  async getTotalCommentsForTarget(targetId) {
    const [[{ total }]] = await execute(
      "SELECT COUNT(*) AS total FROM comments WHERE target_id = ?",
      [targetId],
    );
    return total;
  }

  async select(requesterId, id) {
    const [rows] = await execute(
      `
        SELECT

          comments.*,
          DATE_FORMAT(comments.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
          DATE_FORMAT(comments.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
          username AS author,

          user_reaction.type AS user_reaction_type,

          COUNT(DISTINCT likes.user_id) AS likes,
          COUNT(DISTINCT dislikes.user_id) AS dislikes

        FROM comments

        INNER JOIN users ON users.id = comments.author_id

        LEFT JOIN reactions AS likes
          ON likes.target_id = comments.id AND likes.type = 'like'
        
        LEFT JOIN reactions as dislikes
          ON dislikes.target_id = comments.id AND dislikes.type = 'dislike'

        LEFT JOIN reactions AS user_reaction
          ON user_reaction.target_id = comments.id
          AND user_reaction.user_id = ?

        WHERE comments.id = ?
      `,
      [requesterId ?? -1, id],
    );

    return rows.length ? rows[0] : null;
  }

  async create(id, authorId, targetId, content, parentId = null) {
    const [result] = await execute(
      `INSERT INTO comments(id, author_id, target_id, parent_id, content) VALUES (?, ?, ?, ?, ?)`,
      [id, authorId, targetId, parentId, content],
    );
    return result;
  }

  async update(userId, commentId, content) {
    const [result] = await execute(
      "UPDATE comments SET content = ? WHERE id = ? AND author_id = ?",
      [content, commentId, userId],
    );
    return result.affectedRows > 0;
  }

  async delete(userId, commentId) {
    const [result] = await execute(
      "DELETE entities FROM entities INNER JOIN comments ON comments.id = entities.id WHERE comments.id = ? AND comments.author_id = ?",
      [commentId, userId],
    );
    return result;
  }
}

export default new Comments();
