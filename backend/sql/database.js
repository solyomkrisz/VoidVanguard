const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const usersTableFields = ["username", "email", "gender", "password"];
const profileTableFields = [
  "avatar",
  "display_name",
  "description",
  "visibility",
];

//!SQL Queries
const Test = {
  selectAll: async function () {
    const query = "SELECT * FROM exampletable;";
    const [rows] = await pool.execute(query);
    return rows;
  },
};
const User = {
  exists: async function (id) {
    const query = "SELECT id, username, roles FROM users WHERE id = ?";
    const [rows] = await pool.execute(query, [id]);

    if (!rows.length) {
      throw new Error("User not found");
    }

    const userdata = rows[0];

    const result = {
      sub: userdata.id,
      username: userdata.username,
      roles: userdata.roles.split(","),
    };
    return result;
  },
  update: async function (request, fieldsToUpdate) {
    if (!fieldsToUpdate.length) {
      throw new Error("No valid fields to update");
    }
    let query = "UPDATE users SET ";
    const values = [];
    const currentUser = await User._select(request.targetUser.sub);
    for (const field of fieldsToUpdate) {
      if (!usersTableFields.includes(field)) {
        continue;
      }
      if (field === "password") {
        if (
          await Password.compare(request.body[field], currentUser.password_hash)
        ) {
          continue;
        }
        query += "password_hash = ?, ";
        values.push(await Password.hash(request.body[field]));
      } else {
        if (request.body[field] === currentUser[field]) {
          continue;
        }
        query += `${field} = ?, `;
        values.push(request.body[field]);
      }
    }
    if (!values.length) {
      throw new Error("No valid fields to update");
    }

    query = query.slice(0, -2);
    query += " WHERE id = ?";
    values.push(request.targetUser.sub);
    const [result] = await pool.execute(query, values);

    return result;
  },

  _select: async function (id) {
    const query =
      "SELECT username, email, gender, password_hash FROM users WHERE id = ?";
    const [rows] = await pool.execute(query, [id]);

    return rows.length ? rows[0] : null;
  },

  create: async function (id, username, email, gender, password) {
    const password_hash = await Password.hash(password);
    const query =
      "INSERT INTO users (id, username, email, gender, password_hash) VALUES (?, ?, ?, ?, ?)";
    const [result] = await pool.execute(query, [
      id,
      username,
      email,
      gender,
      password_hash,
    ]);
    return result;
  },

  login: async function (username, password) {
    let query = "SELECT password_hash FROM users WHERE username = ?";
    let [rows] = await pool.execute(query, [username]);
    if (!rows.length) {
      return null;
    }
    if (!(await Password.compare(password, rows[0].password_hash))) {
      return null;
    }
    query = "SELECT id, username, roles FROM users WHERE username = ?";
    [rows] = await pool.execute(query, [username]);
    const userdata = rows[0];
    return {
      sub: userdata.id,
      username: userdata.username,
      roles: userdata.roles.split(","),
    };
  },

  delete: async function (id) {
    const query = "DELETE FROM users WHERE id = ?";
    const [result] = await pool.execute(query, [id]);
    return result;
  },
};

const Profile = {
  _select: async function (id) {
    const query =
      "SELECT avatar, display_name, description, visibility FROM profiles WHERE user_id = ?";
    const [rows] = await pool.execute(query, [id]);

    return rows.length ? rows[0] : null;
  },
  select: async function (request, isFriend) {
    const id = request.params.id;

    let query = "SELECT visibility FROM profiles WHERE user_id = ?";
    let [rows] = await pool.execute(query, [id]);

    if (!rows.length) {
      throw new Error("Profile not found");
    }

    const visibility = rows[0].visibility;

    if (visibility === "friends-only" && isFriend) {
      query =
        "SELECT avatar, display_name, description FROM profiles WHERE user_id = ?";
      [rows] = await pool.execute(query, [id]);
      return rows[0];
    }

    if (visibility === "public" || request?.user?.roles.includes("admin")) {
      query =
        "SELECT avatar, display_name, description FROM profiles WHERE user_id = ?";
      [rows] = await pool.execute(query, [id]);
      return rows[0];
    }

    query = "SELECT avatar, display_name FROM profiles WHERE user_id = ?";
    [rows] = await pool.execute(query, [id]);
    return rows[0];
  },

  create: async function (request) {
    const fields = Object.keys(request.body);

    let query = "INSERT INTO profiles (user_id, ";
    let placeholders = "?, ";
    const values = [request.targetUser.sub];

    for (const field of fields) {
      if (!profileTableFields.includes(field)) {
        continue;
      }
      query += `${field}, `;

      const value = request.body[field];

      placeholders += "?, ";
      values.push(value);
    }

    query = query.slice(0, -2);
    placeholders = placeholders.slice(0, -2);
    query += `) VALUES (${placeholders})`;

    const [result] = await pool.execute(query, values);
    return result;
  },

  update: async function (request) {
    const fields = Object.keys(request.body).filter((field) =>
      profileTableFields.includes(field),
    );

    if (!fields.length) {
      throw new Error("No valid fields to update");
    }
    const currentProfile = await Profile._select(request.targetUser.sub);

    let query = "UPDATE profiles SET ";
    const values = [];
    for (const field of fields) {
      if (request.body[field] === currentProfile[field]) {
        continue;
      }
      query += `${field} = ?, `;
      values.push(request.body[field]);
    }
    if (!values.length) {
      throw new Error("All fields are up to date");
    }
    query = query.slice(0, -2);
    query += " WHERE user_id = ?";
    values.push(request.targetUser.sub);
    const [result] = await pool.execute(query, values);
    return result;
  },

  delete: async function (id) {
    const query = "DELETE FROM profiles WHERE user_id = ?";
    const [result] = await pool.execute(query, [id]);
    return result;
  },
};

const Friendship = {
  exists: async function (user_a_id, user_b_id) {
    const query =
      "SELECT 1 FROM friends WHERE ((initiator_id = ? AND recipient_id = ?) OR (initiator_id = ? AND recipient_id = ?)) AND status = 'accepted'";
    const [rows] = await pool.execute(query, [
      user_a_id,
      user_b_id,
      user_b_id,
      user_a_id,
    ]);
    return rows.length > 0;
  },

  initiate: async function (request) {
    const query =
      "INSERT INTO friends (initiator_id, recipient_id) VALUES (?, ?)";
    const [result] = await pool.execute(query, [
      request.targetUser.sub,
      request.body.user_id,
    ]);
    return result;
  },
  accept: async function (request) {
    const initiator_id = request.body.user_id;
    const recipient_id = request.targetUser.sub;

    const query =
      "UPDATE friends SET status = 'accepted' WHERE status = 'pending' AND initiator_id = ? AND recipient_id = ?";
    const [result] = await pool.execute(query, [initiator_id, recipient_id]);
    return result;
  },

  delete: async function (request) {
    const query =
      "DELETE FROM friends WHERE ((initiator_id = ? AND recipient_id = ?) OR (initiator_id = ? AND recipient_id = ?))";
    const [result] = await pool.execute(query, [
      request.targetUser.sub,
      request.body.user_id,
      request.body.user_id,
      request.targetUser.sub,
    ]);
    return result;
  },

  getAllIncoming: async function (id) {
    const query =
      "SELECT initiator_id FROM friends WHERE recipient_id = ? AND status = 'pending'";
    const [rows] = await pool.execute(query, [id]);
    return rows.length ? rows : null;
  },

  getAllPending: async function (id) {
    const query =
      "SELECT recipient_id FROM friends WHERE initiator_id = ? AND status = 'pending'";
    const [rows] = await pool.execute(query, [id]);
    return rows.length ? rows : null;
  },

  getAll: async function (id) {
    const query = `
      SELECT initiator_id FROM friends WHERE recipient_id = ? AND status = 'accepted'
      UNION
      SELECT recipient_id FROM friends WHERE initiator_id = ? AND status = 'accepted'
    `;
    const [rows] = await pool.execute(query, [id, id]);
    return rows.length ? rows : null;
  },
};

const Block = {
  exists: async function (request) {
    const user_a_id = request?.targetUser.sub;
    const user_b_id = request?.body?.user_id || request?.params?.id;

    if (!user_a_id || !user_b_id) {
      return 0;
    }
    let query = "SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?";
    let [rows] = await pool.execute(query, [user_a_id, user_b_id]);
    if (rows.length) {
      return 1;
    }
    query = "SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?";
    [rows] = await pool.execute(query, [user_b_id, user_a_id]);
    if (rows.length) {
      return 2;
    }
    return 0;
  },

  create: async function (request) {
    const query = "INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)";
    const [result] = await pool.execute(query, [
      request.targetUser.sub,
      request.body.user_id,
    ]);
    return result;
  },

  delete: async function (request) {
    const query = "DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?";
    const [result] = await pool.execute(query, [
      request.targetUser.sub,
      request.body.user_id,
    ]);
    return result;
  },
  getAllBlocked: async function (request) {
    const query = "SELECT blocked_id FROM blocks WHERE blocker_id = ?";
    const [rows] = await pool.execute(query, [request.targetUser.sub]);
    return rows.length ? rows : null;
  },
};

const Password = {
  hash: async function (password) {
    return bcrypt.hash(password, await bcrypt.genSalt(10));
  },
  compare: async function (plain, hashed) {
    return bcrypt.compare(plain, hashed);
  },
};

const Token = {
  get: function (
    payload,
    iat = Math.floor(Date.now() / 1000),
    exp = Math.floor(Date.now() / 1000) + 15 * 60,
    secret = process.env.ACCESS_TOKEN_SECRET,
    options = {},
  ) {
    payload.iat = iat;
    payload.exp = exp;
    return jwt.sign(payload, secret, options);
  },
  verify: function (token, secret) {
    return jwt.verify(token, secret);
  },
  save: async function (sub, token, exp, iat) {
    const query =
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, issued_at) VALUES (?, ?, ?, ?)";
    const token_hash = await bcrypt.hash(token, 10);
    const [result] = await pool.execute(query, [
      sub,
      token_hash,
      new Date(exp * 1000),
      new Date(iat * 1000),
    ]);
    return result;
  },
  revokeAll: async function (sub) {
    const query =
      "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ? AND revoked = FALSE";
    const [result] = await pool.execute(query, [sub]);
    return result;
  },
  deleteAll: async function (sub) {
    const query = "DELETE FROM refresh_tokens WHERE user_id = ?";
    const [result] = await pool.execute(query, [sub]);
    return result;
  },
  find: async function (sub, token) {
    const query =
      "SELECT token_hash FROM refresh_tokens WHERE user_id = ? AND revoked = FALSE";
    const [rows] = await pool.execute(query, [sub]);
    if (!rows.length) {
      return null;
    }
    const token_hash = rows[0].token_hash;
    if (await bcrypt.compare(token, token_hash)) {
      return rows[0];
    } else {
      return null;
    }
  },
};

//!Export
module.exports = {
  Test,
  User,
  Password,
  Token,
  Profile,
  Friendship,
  Block,
};
