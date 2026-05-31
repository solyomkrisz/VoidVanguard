/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/api.js
 * Szerep: API reteg: HTTP endpoint definicio, keretek kozotti tovabbitas a controllernek.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import express from "express";
import users from "./users.js";
import sessions from "./sessions.js";
import tokens from "./tokens.js";
import profiles from "./profiles.js";
import friends from "./friends.js";
import blocks from "./blocks.js";
import comments from "./comments.js";
import reactions from "./reactions.js";
import admin from "./admin.js";
import saves from "./saves.js";
import passwordresets from "./passwordresets.js";
import scores from "./scores.js";

const router = express.Router();

router.get("/test", (request, response) => {
  response.status(200).json({
    message: "Ez a végpont működik.",
  });
});

router.use("/users", users); //
router.use("/sessions", sessions); //
router.use("/tokens", tokens); //
router.use("/profiles", profiles); //
router.use("/friends", friends); //
router.use("/blocks", blocks); //
router.use("/comments", comments); //
router.use("/reactions", reactions); //
router.use("/admin", admin); //
router.use("/saves", saves); //
router.use("/reset-password", passwordresets); //
router.use("/scores", scores); //

export default router;
