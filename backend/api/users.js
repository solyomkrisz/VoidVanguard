import express from "express";
import Users from "../sql/table/Users.js";
import { checkSchema, validationResult } from "express-validator";
import * as validator from "../validator/user.js";
import {
  createResponse,
  authenticate,
  modifyTargetUser,
  handleCaughtError,
  handleExpressValidatorErrors,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
} from "../common/common.js";
import * as CustomError from "../common/CustomError.js";

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
            "Registration is not available for logged-in users"
          )
        );
    },
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  checkSchema(validator.POST),
  async (request, response) => {
    const errors = validationResult(request);

    if (!errors.isEmpty())
      return handleExpressValidatorErrors(response, errors);

    try {
      await Users.create(request);

      response
        .status(201)
        .json(createResponse(true, null, "User created successfully"));
    } catch (error) {
      if (isSequelizeUniqueConstraintError(error)) {
        return handleSequelizeUniqueConstraintError(
          response,
          "Username or email already taken"
        );
      }

      handleCaughtError(response, error);
    }
  }
);

router.patch(
  "/",
  authenticate(),
  modifyTargetUser(),
  checkSchema(validator.PATCH),
  async (request, response) => {
    try {
      if (!request.body) throw CustomError.INVALID_REQUEST;

      const errors = validationResult(request);
      if (!errors.isEmpty())
        return handleExpressValidatorErrors(response, errors);

      if ((await Users.update(request)).affectedRows > 0) {
        return response
          .status(200)
          .json(createResponse(true, null, "User updated successfully"));
      }
      throw CustomError.USER_NOT_FOUND;
    } catch (error) {
      if (isSequelizeUniqueConstraintError(error)) {
        return handleSequelizeUniqueConstraintError(
          response,
          "Username or email already taken"
        );
      }
      handleCaughtError(response, error);
    }
  }
);

router.delete(
  "/",
  authenticate(),
  modifyTargetUser(),
  async (request, response) => {
    try {
      if ((await Users.delete(request)).affectedRows > 0) {
        return response
          .status(200)
          .json(createResponse(true, null, "User deleted successfully"));
      }
      throw CustomError.USER_NOT_FOUND;
    } catch (error) {
      handleCaughtError(response, error);
    }
  }
);

export default router;
