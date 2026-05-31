/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/profiles.js
 * Szerep: Profil-lekerdezo, kereso es sajat profilkezelo vegpontok route-lancai.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import express from "express";
import * as controller from "../controller/profiles.js";
import { checkSchema } from "express-validator";
import * as validator from "../validator/profile.js";
import {
  upload,
  authenticate,
  modifyTargetUser,
  handleValidation,
} from "../common/common.js";

const router = express.Router();

// GET /api/profiles/:id
// Egyetlen profil lekerese URL-parametereben kapott userazonosito alapjan.
// Optional auth megy elotte, mert a lathato adatkör attol is fugghet, hogy ki kerdezi le a profilt.
router.get(
  "/:id",
  authenticate({
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  validator.GET,
  controller.get,
);

// GET /api/profiles?search=
// Profilkereso vegpont. A search query mezot a koztes middleware ellenorzi, hogy csak ertelmes kereses fusson le.
router.get(
  "/",
  authenticate({
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  function (request, _, next) {
    request.valid = !!(request?.query?.search && request.query.search.trim());
    next();
  },
  controller.search,
);

// POST /api/profiles
// Sajat profil letrehozasa. A body mezoit az upload.none() olvassa, utana a validator.POST ellenorzi azokat.
router.post(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  checkSchema(validator.POST),
  handleValidation,
  controller.create,
);

// PATCH /api/profiles
// A bejelentkezett user sajat profiljanak frissitese. A modifyTargetUser miatt a controller biztosan a megfelelo userhez ir.
router.patch(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  checkSchema(validator.PATCH),
  handleValidation,
  controller.update,
);

// DELETE /api/profiles
// Sajat profil torlese. Itt mar nincs kulon schema validacio, mert a route nem var extra body parametert a torleshez.
router.delete(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  controller.remove,
);

export default router;
