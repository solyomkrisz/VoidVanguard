import express from "express";
import * as controller from "../controller/reactions.js";
import {
  upload,
  authenticate,
  modifyTargetUser,
  handleValidation,
} from "../common/common.js";
import { checkSchema } from "express-validator";
import * as validator from "../validator/reaction.js";

const router = express.Router();

router.get(
  "/:targetId",
  authenticate(),
  modifyTargetUser(),
  checkSchema(validator.GET),
  handleValidation,
  controller.get,
);

// prettier-ignore
router.post(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.POST),
  handleValidation,
  controller.create,
);

export default router;
