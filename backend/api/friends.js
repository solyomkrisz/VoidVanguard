import express from "express";
import * as controller from "../controller/friends.js";
import { checkSchema, validationResult } from "express-validator";
import * as validator from "../validator/friend.js";
import {
  upload,
  authenticate,
  modifyTargetUser,
  handleValidation,
} from "../common/common.js";

const router = express.Router();

router.get(
  "/",
  authenticate({
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  modifyTargetUser(),
  controller.lazySelectByTarget,
);

router.get("/:id", authenticate(), modifyTargetUser(), controller.summary);

router.post(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  checkSchema(validator.POST),
  handleValidation,
  controller.sendFriendRequest,
);

router.patch(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  checkSchema(validator.POST),
  handleValidation,
  controller.acceptFriendRequest,
);

router.delete(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  controller.removeFriend,
);

export default router;
