/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/admin.js
 * Szerep: Admin tiltasi es tiltasi eloZmeny vegpontok, jogosultsagellenorzessel.
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

// GET /api/admin/ban?targetUserId=
// Egy user aktualis tiltasi allapotanak lekerese query parameterbol kapott celazonosito alapjan.
// Az auth + authorize elotte azt biztosítja, hogy ezt csak megfelelo jogosultsaggal lehessen kerdezni.
router.get(
  "/ban",
  authenticate(),
  authorize(),
  checkSchema(validator.BAN_STATUS),
  controller.getBanStatus,
);

// GET /api/admin/bans?targetUserId=&page=&limit=
// Egy user tiltasi elozmenyenek lapozott listaja. A query-bol jon a cel user es a lapozasi adatok.
router.get(
  "/bans",
  authenticate(),
  authorize(),
  checkSchema(validator.BAN_STATUS),
  controller.lazySelectUserBans,
);

// POST /api/admin/ban
// Uj tiltás letrehozasa. A body tipikusan userId, reason es opcionális expiresAt mezoket var.
// Az upload.none() miatt multipart/form-data vagy urlencoded mezok is rendben beolvasodnak a validator elott.
router.post(
  "/ban",
  upload.none(),
  authenticate(),
  authorize(),
  checkSchema(validator.BAN),
  handleValidation,
  controller.banUser,
);

// DELETE /api/admin/ban
// Tiltas feloldasa. A body-ban erkezik a userId, amelyre a validator.UNBAN schema fut le.
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
