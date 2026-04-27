import express from "express";
import * as controller from "../controller/tokens.js";
import {
  authenticate,
  handleValidation,
  modifyTargetUser,
} from "../common/common.js";
import { checkSchema } from "express-validator";
import * as validator from "../validator/token.js";

const router = express.Router();

router.get("/", controller.refresh);

router.get(
  "/active",
  authenticate(),
  modifyTargetUser(),
  controller.lazySelectActiveTokens,
);

router.delete(
  "/:id",
  authenticate(),
  modifyTargetUser(),
  checkSchema(validator.DELETE),
  handleValidation,
  controller.revokeSessionById,
);

router.delete("/", controller.revokeSessionByToken);

export default router;
