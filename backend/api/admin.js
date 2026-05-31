/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/admin.js
 * Szerep: API reteg: HTTP endpoint definicio, keretek kozotti tovabbitas a controllernek.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import express, { response } from "express";
import Role from "../common/Role.js";
import {
  authenticate,
  authorize,
  handleValidation,
  upload,
} from "../common/common.js";
import * as controller from "../controller/admin.js";
import * as validator from "../validator/admin.js";
import { check, checkSchema } from "express-validator";

const router = express.Router();

// get ban status for user
router.get(
  "/ban",
  authenticate(),
  authorize(),
  checkSchema(validator.BAN_STATUS),
  controller.getBanStatus,
);

router.get(
  "/bans",
  authenticate(),
  authorize(),
  checkSchema(validator.BAN_STATUS),
  controller.lazySelectUserBans,
);

router.post(
  "/ban",
  upload.none(),
  authenticate(),
  authorize(),
  checkSchema(validator.BAN),
  handleValidation,
  controller.banUser,
);

router.delete(
  "/ban",
  upload.none(),
  authenticate(),
  authorize(),
  checkSchema(validator.UNBAN),
  handleValidation,
  controller.unbanUser,
);

export default router;
