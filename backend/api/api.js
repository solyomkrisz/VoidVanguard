const express = require("express");
const router = express.Router();
const users = require("./users.js");
const sessions = require("./sessions.js");
const tokens = require("./tokens.js");
const profiles = require("./profiles.js");
const friends = require("./friends.js");
const blocks = require("./blocks.js");
const comments = require("./comments.js");
const reactions = require("./reactions.js");

router.get("/test", (request, response) => {
  response.status(200).json({
    message: "Ez a végpont működik.",
  });
});

router.use("/users", users);
router.use("/sessions", sessions);
router.use("/tokens", tokens);
router.use("/profiles", profiles);
router.use("/friends", friends);
router.use("/blocks", blocks);
router.use("/comments", comments);
router.use("/reactions", reactions);

module.exports = router;
