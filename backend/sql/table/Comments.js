const Table = require("../Table.js");
const Column = require("../Column.js");
const CustomError = require("../../common/CustomError.js");
const { execute } = require("../database.js");
const Role = require("../../common/Role.js");
const Permission = require("../../common/Permission.js");
const { v4: uuidv4 } = require("uuid");
const Profiles = require("./Profiles.js");

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

  async lazySelectByTarget({ query }) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    const [rows] = await execute(
      `
        SELECT

          comments.*,
          DATE_FORMAT(comments.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
          DATE_FORMAT(comments.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
          username AS author,

          COUNT(likes.user_id) AS likes,
          COUNT(dislikes.user_id) AS dislikes

        FROM comments

        INNER JOIN users ON users.id = comments.author_id

        LEFT JOIN reactions AS likes
          ON likes.target_id = comments.id AND likes.type = 'like'
        
        LEFT JOIN reactions as dislikes
          ON dislikes.target_id = comments.id AND dislikes.type = 'dislike'

        WHERE comments.target_id = ?

        GROUP BY comments.id
        ORDER BY created_at DESC, comments.id
        DESC LIMIT ? OFFSET ?
      `,
      [query.targetId, limit, offset],
    );

    const [[{ total }]] = await execute(
      "SELECT COUNT(*) AS total FROM comments WHERE target_id = ?",
      [query.targetId],
    );

    return {
      comments: rows,
      page,
      limit,
      total,
      hasNext: offset + rows.length < total,
    };
  }

  async select({ params }) {
    const id = params.id;

    const [rows] = await execute(
      `
        SELECT

          comments.*,
          DATE_FORMAT(comments.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
          DATE_FORMAT(comments.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
          username AS author,

          COUNT(likes.user_id) AS likes,
          COUNT(dislikes.user_id) AS dislikes

        FROM comments

        INNER JOIN users ON users.id = comments.author_id

        LEFT JOIN reactions AS likes
          ON likes.target_id = comments.id AND likes.type = 'like'
        
        LEFT JOIN reactions as dislikes
          ON dislikes.target_id = comments.id AND dislikes.type = 'dislike'

        WHERE comments.id = ?
      `,
      [id],
    );

    if (!rows.length) throw CustomError.TEST;

    return rows[0];
  }

  async create({ body: { authorId, targetId, parentId, content } }) {
    if (parentId && (await this.exists(parentId))) throw CustomError.TEST;

    const [result] = await execute(
      `INSERT INTO comments(id, author_id, target_id, parent_id, content) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), authorId, targetId, parentId || null, content],
    );

    return result;
  }

  async update({ targetUser: { id }, body: { commentId, content } }) {
    const [rows] = await execute(
      "SELECT author_id FROM comments WHERE id = ?",
      [commentId],
    );

    if (!rows.length) throw CustomError.TEST;

    if (rows[0].author_id !== id) throw CustomError.UNAUTHORIZED;

    const [result] = await execute(
      "UPDATE comments SET content = ? WHERE id = ? AND author_id = ?",
      [content, commentId, id],
    );

    return result;
  }

  async delete({ targetUser: { id }, body: { commentId } }) {
    const [result] = await execute(
      "DELETE entities FROM entities INNER JOIN comments ON comments.id = entities.id WHERE comments.id = ? AND comments.author_id = ?",
      [commentId, id],
    );
    return result;
  }
}

module.exports = new Comments();
