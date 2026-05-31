/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/reactions.js
 * Szerep: Reakciok lekerese es atkapcsolasa route-szinten, validacioval es target-user feloldassal.
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

// GET /api/reactions/:targetId
// A bejelentkezett user sajat reakciojanak lekerese az URL-ben kapott celobjektumhoz.
// A validator.GET ellenorzi a path parametert, mielott a controller adatbazis-lekerdezesbe kezd.
router.get(
  "/:targetId",
  authenticate(),
  modifyTargetUser(),
  checkSchema(validator.GET),
  handleValidation,
  controller.get,
);

// POST /api/reactions
// Reakcio letrehozasa, torlese vagy atvaltasa. A body tipikusan targetId es type mezoket var,
// es a service donti el, hogy ebbol insert, update vagy delete lesz.
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
