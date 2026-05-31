/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/blocks.js
 * Szerep: Tiltasi lista, blokkstatusz es block/unblock muveletek route-jai.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import express from "express";
import * as controller from "../controller/blocks.js";
import * as validator from "../validator/block.js";
import { upload, authenticate, modifyTargetUser } from "../common/common.js";

const router = express.Router();

// GET /api/blocks?targetId=&page=&limit=
// A hitelesitett user tiltasi listajanak lapozott lekerese query parameterekkel.
// A validator.GET ellenorzi, hogy a query-bol jovo targetId es lapozasi mezok megfeleloek-e.
router.get("/", authenticate(), validator.GET, controller.lazySelectByTarget);

// GET /api/blocks/:id?include=status
// Egy userre vonatkozo tiltasi osszegzes vagy statusz. Az :id az URL-bol jon,
// a modifyTargetUser pedig a kerdezo usert teszi a requestbe a ketoldali statusz szamolashoz.
router.get("/:id", authenticate(), modifyTargetUser(), controller.summary);

// POST /api/blocks
// Felhasznalo letiltasa a body-ban kuldott userId alapjan.
// Az upload.none() a form mezok beolvasasa miatt kell, utana a validator.POST ellenorzi a testet.
router.post(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  validator.POST,
  controller.blockUser,
);

// DELETE /api/blocks
// Tiltas feloldasa ugyanazzal a body-formaval, mint a letrehozas, ezert ugyanaz a validator.POST schema fut rajta.
router.delete(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  validator.POST,
  controller.unblockUser,
);

export default router;
