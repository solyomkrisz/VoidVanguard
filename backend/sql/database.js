const mysql = require("mysql2/promise");
const { Password } = require("../common/common.js");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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

//!Export
module.exports = {
  Test,
  User,
};
