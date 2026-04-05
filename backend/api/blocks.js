import express from "express";
import * as controller from "../controller/blocks.js";
import * as validator from "../validator/block.js";
import { upload, authenticate, modifyTargetUser } from "../common/common.js";

const router = express.Router();

router.get("/", authenticate(), validator.GET, controller.lazySelectByTarget);

// status check
router.get("/:id", authenticate(), controller.summary);

router.post(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  validator.POST,
  controller.blockUser,
);

router.delete(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  validator.POST,
  controller.unblockUser,
);

export default router;
