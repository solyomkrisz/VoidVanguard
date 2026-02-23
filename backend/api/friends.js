const express = require("express");
const router = express.Router();
const Friends = require("../sql/table/Friends.js");
const Blocks = require("../sql/table/Blocks.js");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/friend.js");
const {
  createResponse,
  authenticate,
  modifyTargetUser,
  handleExpressValidatorErrors,
  handleCaughtError,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
} = require("../common/common.js");

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
      await Blocks.exists(request);
      await Friends.initiate(request);
      response
        .status(200)
        .json(createResponse(true, null, "Friend request sent successfully."));
    } catch (error) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return response
          .status(404)
          .json(createResponse(false, null, "Target user not found."));
      }
      if (isSequelizeUniqueConstraintError(error)) {
        return handleSequelizeUniqueConstraintError(
          response,
          "A friend request already exists or you are already friends with this user.",
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
  async (request, response) => {
    try {
      if ((await Friends.accept(request)).affectedRows === 0) {
        return response
          .status(404)
          .json(createResponse(false, null, "Friend request not found"));
      }

      response
        .status(200)
        .json(
          createResponse(true, null, "Friend request accepted successfully"),
        );
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
      if ((await Friends.delete(request)).affectedRows === 0) {
        return response
          .status(404)
          .json(createResponse(false, null, "Friendship not found"));
      }

      response
        .status(200)
        .json(createResponse(true, null, "Friendship deleted successfully"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

module.exports = router;
