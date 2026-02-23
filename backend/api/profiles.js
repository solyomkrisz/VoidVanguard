const express = require("express");
const router = express.Router();
const Profiles = require("../sql//table/Profiles.js");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/profile.js");
const CustomError = require("../common/CustomError.js");
const {
  createResponse,
  authenticate,
  modifyTargetUser,
  handleCaughtError,
  handleExpressValidatorErrors,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
} = require("../common/common.js");

router.get("/:id", validator.GET, async (request, response) => {
  try {
    if (!request.valid) throw CustomError.INVALID_REQUEST;

    const result = await Profiles.select(request);

    response
      .status(200)
      .json(createResponse(true, result, "Profile fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
});

router.post(
  "/",
  authenticate(),
  modifyTargetUser(),
  checkSchema(validator.POST),
  async (request, response) => {
    const errors = validationResult(request);

    if (!errors.isEmpty())
      return handleExpressValidatorErrors(response, errors);

    try {
      await Profiles.create(request);

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
  checkSchema(validator.PATCH),
  async (request, response) => {
    const errors = validationResult(request);

    if (!errors.isEmpty())
      return handleExpressValidatorErrors(response, errors);

    try {
      if (!request.body) throw CustomError.INVALID_REQUEST;

      if ((await Profiles.update(request)).affectedRows === 0)
        throw CustomError.PROFILE_NOT_FOUND;

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
      if ((await Profiles.delete(request)).affectedRows === 0)
        throw CustomError.PROFILE_NOT_FOUND;

      response
        .status(200)
        .json(createResponse(true, null, "Profile deleted successfully"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

module.exports = router;
