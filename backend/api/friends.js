const express = require("express");
const router = express.Router();
const { Friendship } = require("../sql/database.js");
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
  checkSchema(validator.POST),

  async (request, response) => {
    const errors = validationResult(request);

    if (!errors.isEmpty()) {
      return response
        .status(400)
        .json(createResponse(false, null, errors.array()[0].msg));
    }

    try {
      const result = await Friendship.initiate(request);

      if (!result) {
        throw new Error();
      }

      response
        .status(200)
        .json(
          createResponse(true, result, "Friend request sent successfully."),
        );
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

router.patch("/", authenticate(), (request, response) => {});

router.delete("/", authenticate(), (request, response) => {});

module.exports = router;
