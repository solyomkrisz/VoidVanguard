import express from "express";
import * as controller from "../controller/blocks.js";
import * as validator from "../validator/block.js";
import { upload, authenticate, modifyTargetUser } from "../common/common.js";

const router = express.Router();

// router.get(
//   "/",
//   authenticate(),
//   modifyTargetUser(),
//   validator.POST,
//   controller.getBlockedUsers,
// );

router.get("/:id", authenticate(), modifyTargetUser(), controller.summary);

router.post(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  validator.POST,
  controller.blockUser,
);

router.delete(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  validator.POST,
  controller.unblockUser,
);

export default router;
