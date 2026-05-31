/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/tokens.js
 * Szerep: Refresh tokenes session-megujitas es aktiv sessionok kezelesenek route-jai.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import express from "express";
import * as controller from "../controller/tokens.js";
import {
  authenticate,
  handleValidation,
  modifyTargetUser,
} from "../common/common.js";
import { checkSchema } from "express-validator";
import * as validator from "../validator/token.js";

const router = express.Router();

// GET /api/tokens
// Access token frissitese a cookie-ban vagy mas hordozoban kuldott refresh token alapjan.
// Itt nincs kulon validator, mert a controller/service maga a refresh token elerhetoseget es ervenyesseget ellenorzi.
router.get("/", controller.refresh);

// GET /api/tokens/active?page=&limit=
// A bejelentkezett user aktiv sessionjeinek lapozott listaja.
// A modifyTargetUser itt arra kell, hogy a controller biztosan a hitelesitett user sessionjeit nezze.
router.get(
  "/active",
  authenticate(),
  modifyTargetUser(),
  controller.lazySelectActiveTokens,
);

// DELETE /api/tokens/:id
// Egyetlen session visszavonasa az URL-ben kapott sessionazonosito alapjan.
// A validator.DELETE ellenorzi a :id parametert, mielott a controller torlesbe kezd.
router.delete(
  "/:id",
  authenticate(),
  modifyTargetUser(),
  checkSchema(validator.DELETE),
  handleValidation,
  controller.revokeSessionById,
);

// DELETE /api/tokens
// A jelenlegi refresh tokenhez tartozo session megszuntetese, tipikusan "kijelentkezes ezen az eszkozön" esetben.
router.delete("/", controller.revokeSessionByToken);

export default router;
