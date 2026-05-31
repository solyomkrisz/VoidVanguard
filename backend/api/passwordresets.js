/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/passwordresets.js
 * Szerep: Jelszo-visszaallitasi kerelmek es tokenes megerosites ketlepcsos route-jai.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
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

// POST /api/reset-password/request
// Jelszo-visszaallitasi email kerese. A body jellemzoen email mezot tartalmaz,
// amit a validator.REQUEST ellenoriz, mielott rate limiting es emailkuldes indul.
router.post(
  "/request",
  upload.none(),
  checkSchema(validator.REQUEST),
  handleValidation,
  controller.requestPasswordReset,
);

// POST /api/reset-password/confirm
// A visszaallitasi token es az uj jelszo bekuldese. A body tipikusan token + password mezoket var.
router.post(
  "/confirm",
  upload.none(),
  checkSchema(validator.CONFIRM),
  handleValidation,
  controller.resetPassword,
);

export default router;
