const express = require("express");
const router = express.Router();
const Blocks = require("../sql/table/Blocks.js");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/block.js");
const {
  createResponse,
  authenticate,
  modifyTargetUser,
} = require("../common/common.js");

router.get(
  "/",
  authenticate(),
  modifyTargetUser(),
  validator.POST,
  async (request, response) => {
    if (!request.valid) {
      return response
        .status(400)
        .json(createResponse(false, null, "Invalid user ID"));
    }

    try {
      const result = await Blocks.getAllBlocked(request);
      if (!result) {
        return response
          .status(404)
          .json(createResponse(false, null, "No blocked users found"));
      }
      response
        .status(200)
        .json(
          createResponse(true, result, "Blocked users retrieved successfully"),
        );
    } catch (error) {
      console.log(error);
      return response
        .status(500)
        .json(createResponse(false, null, "Error fetching blocked users"));
    }
  },
);

router.post(
  "/",
  authenticate(),
  modifyTargetUser(),
  validator.POST,
  async (request, response) => {
    if (!request.valid) {
      return response
        .status(400)
        .json(createResponse(false, null, "Invalid user ID"));
    }

    try {
      await Blocks.create(request);
      response
        .status(200)
        .json(createResponse(true, null, "User blocked successfully"));
    } catch (error) {
      console.log(error);

      if (error.code === "ER_DUP_ENTRY") {
        return response
          .status(500)
          .json(createResponse(false, null, "User is already blocked"));
      }

      response
        .status(500)
        .json(createResponse(false, null, "Failed to block user"));
    }
  },
);
router.delete(
  "/",
  authenticate(),
  modifyTargetUser(),
  validator.POST,
  async (request, response) => {
    if (!request.valid) {
      return response
        .status(400)
        .json(createResponse(false, null, "Invalid user ID"));
    }

    try {
      const result = await Blocks.delete(request);
      if (result.affectedRows === 0) {
        return response
          .status(404)
          .json(createResponse(false, null, "User is not blocked"));
      }

      response
        .status(200)
        .json(createResponse(true, null, "User unblocked successfully"));
    } catch (error) {
      console.log(error);
      response
        .status(500)
        .json(createResponse(false, null, "Failed to unblock user"));
    }
  },
);

module.exports = router;
