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
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.POST),
  handleValidation,
  controller.sendFriendRequest,
);

router.patch(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.POST),
  handleValidation,
  controller.acceptFriendRequest,
);

router.delete(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  controller.removeFriend,
);

export default router;
