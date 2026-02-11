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
    for (const field of fieldsToUpdate) {
      if (!usersTableFields.includes(field)) {
        continue;
      }
      if (field === "password") {
        query += "password_hash = ?, ";
        values.push(await Password.hash(request.body[field]));
      } else {
        query += `${field} = ?, `;
        values.push(request.body[field]);
      }
    }
    if (!values.length) {
      throw new Error("No valid fields to update");
    }

    query = query.slice(0, -2);
    query += " WHERE id = ?";
    values.push(request.user.sub);
    const [result] = await pool.execute(query, values);

    return result;
  },

  select: async function (id) {
    const query = "SELECT username FROM users WHERE id = ?";
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
};
