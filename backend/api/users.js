import express from "express";
import * as controller from "../controller/users.js";
import { checkSchema, validationResult } from "express-validator";
import * as validator from "../validator/user.js";
import {
  createResponse,
  authenticate,
  modifyTargetUser,
  handleValidation,
} from "../common/common.js";

const router = express.Router();

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
  checkSchema(validator.POST),
  handleValidation,
  controller.register,
);

router.patch(
  "/",
  authenticate(),
  modifyTargetUser(),
  checkSchema(validator.PATCH),
  handleValidation,
  controller.update,
);

router.delete("/", authenticate(), modifyTargetUser(), controller.remove);

export default router;
