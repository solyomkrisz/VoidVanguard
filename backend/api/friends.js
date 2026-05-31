/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/friends.js
 * Szerep: Ismeroslista, kapcsolatstatusz es jeloleskezelo route-ok middleware-lancai.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
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

// GET /api/friends?targetId=&page=&limit=&status=&direction=
// Egy user ismeros- vagy pending listajanak lekerese query parameterek alapjan.
// Optional auth fut elotte, mert bizonyos nezetei vendegkent is kerhetok, de bejelentkezve pontosabb statuszok szamolhatok.
router.get(
  "/",
  authenticate({
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  modifyTargetUser(),
  controller.lazySelectByTarget,
);

// GET /api/friends/:id?include=
// Osszegzo vegpont egy adott userhez: az URL-ben jon a user id, a query include pedig megmondja,
// hogy pl. preview, incomingCount vagy status is kell-e a valaszba.
router.get(
  "/:id",
  authenticate({
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  modifyTargetUser(),
  controller.summary,
);

// POST /api/friends
// Ismerosjeloles kuldese. A body-ban erkezik a cel user azonositoja, amelyet a validator.POST ellenoriz.
router.post(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  checkSchema(validator.POST),
  handleValidation,
  controller.sendFriendRequest,
);

// PATCH /api/friends
// Bejovo ismerosjeloles elfogadasa. Ugyanazt a validator.POST sémát hasznalja, mert itt is egy userId-t varunk a body-ban.
router.patch(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  checkSchema(validator.POST),
  handleValidation,
  controller.acceptFriendRequest,
);

// DELETE /api/friends
// Baratsag vagy pending kapcsolat torlese. A controller a hitelesitett es a body-ban kapott userbol rakja ossze a torlendo part.
router.delete(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  controller.removeFriend,
);

export default router;
