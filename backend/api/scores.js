/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/scores.js
 * Szerep: API reteg: HTTP endpoint definicio, keretek kozotti tovabbitas a controllernek.
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

router.get(
  "/",
  authenticate(),
  checkSchema(validator.GET),
  controller.getBestScoreWithRankForUser,
);

export default router;
