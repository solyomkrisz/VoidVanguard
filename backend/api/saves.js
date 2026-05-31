/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/saves.js
 * Szerep: Jatekmentesek listazo, lekerdezo, modosito es torlo route-jai.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import express from "express";
import * as controller from "../controller/saves.js";
import {
  createResponse,
  authenticate,
  handleValidation,
  upload,
} from "../common/common.js";
import { checkSchema } from "express-validator";
import * as validator from "../validator/save.js";

const router = express.Router();

// GET /api/saves?page=&limit=
// A hitelesitett user menteslistajanak lapozott lekerese.
router.get("/", authenticate(), controller.lazySelectByUserId);

// GET /api/saves/:id
// Egyetlen mentes lekerese az URL-ben kapott game/save azonosito alapjan.
// A validator.GET a path parametert ellenorzi, mielott a controller adatot olvasna.
router.get("/:id", authenticate(), validator.GET, controller.selectSave);

// PATCH /api/saves
// Reszleges mentesfrissites. A body mezoit a validator.PATCH schema ellenorzi.
router.patch(
  "/",
  authenticate(),
  upload.none(),
  checkSchema(validator.PATCH),
  handleValidation,
  controller.patchSave
);

// PUT /api/saves
// Teljes save-or-update muvelet: ha mar van mentes az adott jatekhoz, frissiti, kulonben letrehozza.
// Ezert kulon HTTP ige, mert szemantikailag idempotensebb teljes allapotkuldesre van szanva.
router.put(
  "/",
  authenticate(),
  upload.none(),
  checkSchema(validator.PUT),
  handleValidation,
  controller.saveOrUpdate
);

// DELETE /api/saves
// Mentes torlese body-ban kapott azonosito alapjan.
router.delete(
  "/",
  authenticate(),
  upload.none(),
  checkSchema(validator.DELETE),
  handleValidation,
  controller.deleteSave
);

export default router;
