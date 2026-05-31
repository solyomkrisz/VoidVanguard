/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/sessions.js
 * Szerep: Bejelentkezes es session-torles route-jai az auth middleware kulonbozo agaival.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import express from "express";
import * as controller from "../controller/sessions.js";
import {
  createResponse,
  authenticate,
  handleValidation,
} from "../common/common.js";
import { checkSchema } from "express-validator";
import * as validator from "../validator/session.js";

const router = express.Router();

// POST /api/sessions
// Bejelentkezes. Ha mar van ervenyes access token, a route nem jelentkeztet be ujra,
// hanem az onValidAccessToken ag azonnal visszaadja a jelenlegi usert.
router.post(
  "/",
  authenticate({
    onValidAccessToken: (request, response, _1) => {
      response
        .status(200)
        .json(createResponse(true, request.user, "Already logged in"));
    },
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  checkSchema(validator.POST),
  handleValidation,
  controller.login,
);

// DELETE /api/sessions
// Az aktualis vagy epp lejart access token melletti sessionok takaritasa.
// Azert optional az auth, mert kijelentkezeskor a kliens oldalon mar lehet lejart token is.
router.delete(
  "/",
  authenticate({
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  controller.destroyAllSessions,
);

export default router;
