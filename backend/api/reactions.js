/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/reactions.js
 * Szerep: API reteg: HTTP endpoint definicio, keretek kozotti tovabbitas a controllernek.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
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
  upload.none(),
  modifyTargetUser(),
  checkSchema(validator.POST),
  handleValidation,
  controller.create,
);

export default router;
