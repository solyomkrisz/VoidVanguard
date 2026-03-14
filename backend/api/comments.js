import express from "express";
import * as controller from "../controller/comments.js";
import {
  authenticate,
  modifyTargetUser,
  upload,
  handleValidation,
} from "../common/common.js";
import { checkSchema } from "express-validator";
import * as validator from "../validator/comment.js";

const router = express.Router();

router.get(
  "/",
  checkSchema(validator.GET),
  handleValidation,
  controller.lazySelectComments,
);

router.get("/:id", controller.getComment);

router.post(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.POST),
  handleValidation,
  controller.createComment,
);

router.patch(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.PATCH),
  handleValidation,
  controller.updateComment,
);

router.delete(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.DELETE),
  handleValidation,
  controller.deleteComment,
);

export default router;
