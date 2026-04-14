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

// only admin
router.get("/:id", authenticate(), validator.GET, controller.get);

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
