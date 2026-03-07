const Table = require("../Table.js");
const Column = require("../Column.js");
const CustomError = require("../../common/CustomError.js");
const { execute } = require("../database.js");
const Role = require("../../common/Role.js");
const Permission = require("../../common/Permission.js");
const { v4: uuidv4 } = require("uuid");
const Profiles = require("./Profiles.js");

const targetChecks = {
  profile: async (targetId) => {
    if (!(await Profiles.exists(targetId))) throw CustomError.PROFILE_NOT_FOUND;
  },
};

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
        SELECT comments.*, DATE_FORMAT(comments.created_at, '%Y-%m-%d %H:%i:%s') AS created_at, username AS author
        FROM comments
        INNER JOIN users ON users.id = comments.author_id
        WHERE target_id = ? ORDER BY created_at DESC, comments.id DESC LIMIT ? OFFSET ?
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

  async select({ body: { targetId } }) {
    const [rows] = await execute("SELECT * FROM comments WHERE target_id = ?", [
      targetId,
    ]);
    return rows;
  }

  async create({
    body: { authorId, targetType, targetId, parentId, content },
  }) {
    await targetChecks[targetType](targetId);

    if (parentId && (await this.exists(parentId))) throw CustomError.TEST;

    const [result] = await execute(
      `INSERT INTO comments(id, author_id, target_type, target_id, parent_id, content) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), authorId, targetType, targetId, parentId || null, content],
    );

    return result;
  }

  async update({ targetUser: { sub: id }, body: { commentId, content } }) {
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

  async delete({ targetUser: { sub: id }, body: { commentId } }) {
    const [result] = await execute(
      "DELETE FROM comments WHERE id = ? AND author_id = ?",
      [commentId, id],
    );
    return result;
  }
}

module.exports = new Comments();
