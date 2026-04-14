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

router.get(
  "/:id",
  authenticate({
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  validator.GET,
  controller.get,
);

// for searching
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

router.post(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  checkSchema(validator.POST),
  handleValidation,
  controller.create,
);

router.patch(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  checkSchema(validator.PATCH),
  handleValidation,
  controller.update,
);

router.delete(
  "/",
  authenticate(),
  upload.none(),
  modifyTargetUser(),
  controller.remove,
);

export default router;
