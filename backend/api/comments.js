/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/comments.js
 * Szerep: API reteg: HTTP endpoint definicio, keretek kozotti tovabbitas a controllernek.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import express from "express";
import * as controller from "../controller/comments.js";
import {
  authenticate,
  modifyTargetUser,
  upload,
  handleValidation,
} from "../common/common.js";
import { checkSchema } from "express-validator";
import * as validator from "../validator/comment.js";

const router = express.Router();

// GET /api/comments?targetId=&page=&limit=
// Nyilvanos listazo vegpont: token nelkul is mukodhet, de ha van hitelesitett user,
// akkor a modifyTargetUser a request.targetUser-ba beteszi, es a controller figyelembe tudja venni.
router.get(
  "/",
  authenticate({
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  modifyTargetUser(),
  checkSchema(validator.GET),
  handleValidation,
  controller.lazySelectComments,
);

// GET /api/comments/:id
// Egyetlen komment lekerese az URL-parametereben kapott kommentazonosito alapjan.
// Itt is optional auth megy, hogy ugyanaz a route vendegkent es bejelentkezve is hasznalhato legyen.
router.get(
  "/:id",
  authenticate({
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  modifyTargetUser(),
  controller.getComment,
);

// POST /api/comments
// Uj komment letrehozasa. A body tipikusan targetId, parentId es content mezoket var.
// A sorrend fontos: auth utan upload.none() olvassa be a form mezoket, aztan jon a validacio.
router.post(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  checkSchema(validator.POST),
  handleValidation,
  controller.createComment,
);

// PATCH /api/comments
// Meglevo komment modositasa. A validator.PATCH mondja meg, mely body mezok kotelezoek.
router.patch(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  checkSchema(validator.PATCH),
  handleValidation,
  controller.updateComment,
);

// DELETE /api/comments
// Komment torlese body-ban kuldott commentId alapjan.
// A target user es az auth itt kell ahhoz, hogy a controller el tudja donteni: sajat komment torlese vagy admin torles tortenik.
router.delete(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.DELETE),
  handleValidation,
  controller.deleteComment,
);

export default router;
