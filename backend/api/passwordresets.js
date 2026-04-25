import express from "express";
import * as controller from "../controller/passwordresets.js";
import { checkSchema } from "express-validator";
import * as validator from "../validator/passwordreset.js";
import {
  upload,
  authenticate,
  modifyTargetUser,
  handleValidation,
} from "../common/common.js";

const router = express.Router();

router.post(
  "/request",
  upload.none(),
  checkSchema(validator.REQUEST),
  handleValidation,
  controller.requestPasswordReset,
);

router.post(
  "/confirm",
  upload.none(),
  checkSchema(validator.CONFIRM),
  handleValidation,
  controller.resetPassword,
);

export default router;
