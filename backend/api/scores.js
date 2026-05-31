/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/scores.js
 * Szerep: Toplista- es sajat pontszam-lekero route-ok public/private auth mintaval.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import express from "express";
import {
  createResponse,
  authenticate,
  handleValidation,
  upload,
} from "../common/common.js";
import { checkSchema } from "express-validator";
import * as validator from "../validator/score.js";
import * as controller from "../controller/scores.js";

const router = express.Router();

// GET /api/scores/leaderboard?view=&page=&limit=
// Toplista vegpont. Optional auth mellett is mukodik, mert a publikus toplista vendegkent is kerheto,
// de a query view=private csak hitelesitett userrel ad ertelmes eredmenyt.
router.get(
  "/leaderboard",
  authenticate({
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  checkSchema(validator.GET),
  handleValidation,
  controller.lazySelectBestUserScores,
);

// GET /api/scores
// A jelenlegi bejelentkezett user legjobb eredmenye es helyezese.
// Itt kotelezo az auth, mert nincs kulon query userId: mindig a sajat rangot kerjuk le.
router.get(
  "/",
  authenticate(),
  checkSchema(validator.GET),
  controller.getBestScoreWithRankForUser,
);

export default router;
