const express = require("express");
const router = express.Router();
const { Friendship, Block } = require("../sql/database.js");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/friend.js");
const {
  createResponse,
  authenticate,
  modifyTargetUser,
} = require("../common/common.js");

router.post(
  "/",
  authenticate(),
  modifyTargetUser(),
  checkSchema(validator.POST),
  async (request, response) => {
    const errors = validationResult(request);

    if (!errors.isEmpty()) {
      return response
        .status(400)
        .json(createResponse(false, null, errors.array()[0].msg));
    }

    try {
      const blockedStatus = await Block.exists(request);
      if (blockedStatus) {
        if (blockedStatus === 2) {
          throw new Error("The recipient has blocked the initiator");
        }
        return response
          .status(403)
          .json(
            createResponse(
              false,
              null,
              "Unable to send request to a user who has been previously blocked",
            ),
          );
      }
      const result = await Friendship.initiate(request);

      if (!result) {
        throw new Error();
      }

      response
        .status(200)
        .json(createResponse(true, null, "Friend request sent successfully."));
    } catch (error) {
      console.log(error);

      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return response
          .status(404)
          .json(createResponse(false, null, "Target user not found."));
      }

      if (error.code === "ER_DUP_ENTRY") {
        return response
          .status(404)
          .json(
            createResponse(
              false,
              null,
              "Friend request already exists or you are already friends.",
            ),
          );
      }

      response
        .status(500)
        .json(createResponse(false, null, "Failed to send friend request."));
    }
  },
);

router.patch(
  "/",
  authenticate(),
  modifyTargetUser(),
  async (request, response) => {
    try {
      const result = await Friendship.accept(request);

      if (!result) {
        throw new Error();
      }

      if (result.affectedRows === 0) {
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
      console.log(error);

      response
        .status(500)
        .json(createResponse(false, null, "Failed to accept friend request."));
    }
  },
);

router.delete(
  "/",
  authenticate(),
  modifyTargetUser(),
  async (request, response) => {
    try {
      const result = await Friendship.delete(request);

      if (!result) {
        throw new Error();
      }

      if (result.affectedRows === 0) {
        return response
          .status(404)
          .json(createResponse(false, null, "Friendship not found"));
      }

      response
        .status(200)
        .json(createResponse(true, null, "Friendship deleted successfully"));
    } catch (error) {
      console.log(error);

      response
        .status(500)
        .json(createResponse(false, null, "Failed to delete friendship"));
    }
  },
);

module.exports = router;
