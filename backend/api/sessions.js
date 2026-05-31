/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/sessions.js
 * Szerep: API reteg: HTTP endpoint definicio, keretek kozotti tovabbitas a controllernek.
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

router.delete(
  "/",
  authenticate({
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  controller.destroyAllSessions,
);

export default router;
