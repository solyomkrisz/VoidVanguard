const express = require("express");
const router = express.Router();
const database = require("../sql/database.js");
const fs = require("fs/promises");
const users = require("./users.js");
const sessions = require("./sessions.js");
const tokens = require("./tokens.js");
const profiles = require("./profiles.js");
const friends = require("./friends.js");

//!Multer
const multer = require("multer"); //?npm install multer
const path = require("path");

const storage = multer.diskStorage({
  destination: (request, file, callback) => {
    callback(null, path.join(__dirname, "../uploads"));
  },
  filename: (request, file, callback) => {
    callback(null, Date.now() + "-" + file.originalname); //?egyedi név: dátum - file eredeti neve
  },
});

const upload = multer({ storage });

//!Endpoints:
//?GET /api/test
router.get("/test", (request, response) => {
  response.status(200).json({
    message: "Ez a végpont működik.",
  });
});

//?GET /api/testsql
router.get("/testsql", async (request, response) => {
  try {
    const selectall = await database.Test.selectAll();
    response.status(200).json({
      success: true,
      message: "Ez a végpont működik.",
      result: selectall,
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      result: null,
      message: "Ez a végpont nem működik.",
    });
  }
});

router.use("/users", users);
router.use("/sessions", sessions);
router.use("/tokens", tokens);
router.use("/profiles", profiles);
router.use("/friends", friends);

module.exports = router;
