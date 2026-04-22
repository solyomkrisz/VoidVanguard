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
  authenticate(),
  checkSchema(validator.GET),
  controller.lazySelectBestUserScores,
);

router.get(
  "/",
  authenticate(),
  checkSchema(validator.GET),
  controller.getBestScoreWithRankForUser,
);

export default router;
