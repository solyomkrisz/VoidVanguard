import express from "express";
import * as service from "../service/profiles.js";
import { checkSchema, validationResult } from "express-validator";
import * as validator from "../validator/profile.js";
import * as CustomError from "../common/CustomError.js";
import {
  upload,
  createResponse,
  authenticate,
  modifyTargetUser,
  handleCaughtError,
  handleExpressValidatorErrors,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
} from "../common/common.js";

const router = express.Router();

router.get(
  "/:id",
  authenticate({
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, _1, next) => next(),
  }),
  validator.GET,
  async (request, response) => {
    try {
      if (!request.valid) throw CustomError.INVALID_REQUEST;

      const result = await service.getProfile({
        userId: request.params.id,
        requesterId: request?.user?.id || null,
        role: request?.user?.role || -1,
      });

      response
        .status(200)
        .json(createResponse(true, result, "Profile fetched successfully"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
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
  async (request, response) => {
    try {
      if (!request.valid) throw CustomError.INVALID_REQUEST;

      const result = await service.searchFor({
        query: decodeURIComponent(request.query.search),
      });

      response
        .status(200)
        .json(
          createResponse(
            true,
            { profiles: result },
            "Search successfully completed",
          ),
        );
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

router.post(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.POST),
  async (request, response) => {
    const errors = validationResult(request);

    if (!errors.isEmpty())
      return handleExpressValidatorErrors(response, errors);

    try {
      await service.createProfile({
        userId: request.targetUser.id,
        role: request.targetUser.role,
        body: request.body,
      });

      response
        .status(200)
        .json(createResponse(true, null, "Profile created successfully"));
    } catch (error) {
      if (isSequelizeUniqueConstraintError(error)) {
        return handleSequelizeUniqueConstraintError(
          response,
          "Profile for this user already exists",
        );
      }
      handleCaughtError(response, error);
    }
  },
);

router.patch(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.PATCH),
  async (request, response) => {
    const errors = validationResult(request);

    if (!errors.isEmpty())
      return handleExpressValidatorErrors(response, errors);

    try {
      if (!request.body) throw CustomError.INVALID_REQUEST;

      await service.updateProfile({
        userId: request.targetUser.id,
        role: request.targetUser.role,
        body: request.body,
      });

      response
        .status(200)
        .json(createResponse(true, null, "Profile updated successfully"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

router.delete(
  "/",
  authenticate(),
  modifyTargetUser(),
  async (request, response) => {
    try {
      await service.deleteProfile({ userId: request.targetUser.id });

      response
        .status(200)
        .json(createResponse(true, null, "Profile deleted successfully"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

export default router;
