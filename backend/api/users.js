/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/users.js
 * Szerep: Felhasznalo-kereso, regisztracios es sajat fiokkezelo vegpontok middleware-lancai.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import express from "express";
import * as controller from "../controller/users.js";
import { checkSchema } from "express-validator";
import * as validator from "../validator/user.js";
import {
  createResponse,
  authenticate,
  authorize,
  modifyTargetUser,
  handleValidation,
  upload,
} from "../common/common.js";
import Role from "../common/Role.js";

const router = express.Router();

// GET /api/users/:id
// Egyetlen user lekerese az URL-ben kapott :id alapjan.
// Ez a route vedett, mert a felhasznaloreszletekhez itt kotelezo a hitelesites.
router.get("/:id", authenticate(), validator.GET, controller.get);

// GET /api/users?search=
// Felhasznalo-kereso vegpont. A search query parameterbol dolgozik, es optional auth mellett is futhat.
// A kis koztes middleware a request.valid mezot allitja be, hogy ures keresoszora ne fusson felesleges lekerdezes.
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

// POST /api/users
// Regisztracio. A body mezoket az upload.none() olvassa be, a validator.POST pedig ellenorzi.
// Ha a kliens mar be van jelentkezve ervenyes tokennel, a route inkabb udvarias sikeruzenettel leall, nem kezd uj regisztraciot.
router.post(
  "/",
  authenticate({
    onValidAccessToken: (_, response, _1) => {
      response
        .status(200)
        .json(
          createResponse(
            true,
            null,
            "Registration is not available for logged-in users",
          ),
        );
    },
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  upload.none(),
  checkSchema(validator.POST),
  handleValidation,
  controller.register,
);

// PATCH /api/users
// Sajat felhasznaloi adatok modositasa. A modifyTargetUser az aktualis usert teszi a requestbe,
// hogy a controllernek ne a kliens altal kuldott id-ben kelljen megbiznia.
router.patch(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  checkSchema(validator.PATCH),
  handleValidation,
  controller.update,
);

// DELETE /api/users
// A hitelesitett user sajat fiokjanak torlese. Itt is a targetUser middleware mondja meg, kirol van szo.
router.delete(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  controller.remove,
);

export default router;
