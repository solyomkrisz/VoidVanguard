const express = require("express");
const router = express.Router();
const { User, Profile } = require("../sql/database.js");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/profile.js");
const {
  createResponse,
  authenticate,
  modifyTargetUser,
  isFriend,
} = require("../common/common.js");

router.get("/:id", validator.GET, async (request, response) => {
  if (!request.valid) {
    return response
      .status(400)
      .json(createResponse(false, null, "Invalid user ID"));
  }

  try {
    const result = await Profile.select(request, await isFriend(request));

    if (!result) {
      throw new Error("Profile not found");
    }

    response
      .status(200)
      .json(createResponse(true, result, "Profile fetched successfully"));
  } catch (error) {
    console.log(error);

    response
      .status(500)
      .json(createResponse(false, null, "Error fetching user profile"));
  }
});

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
      const result = await Profile.update(request);

      if (!result) {
        throw new Error("Profile update failed");
      }

      response
        .status(200)
        .json(createResponse(true, result, "Profile updated successfully"));
    } catch (error) {
      console.log(error);

      if (
        error.name === "SequelizeUniqueConstraintError" ||
        error.code === "ER_DUP_ENTRY"
      ) {
        return response
          .status(400)
          .json(
            createResponse(
              false,
              null,
              "This user already has an existing profile",
            ),
          );
      }

      response
        .status(500)
        .json(createResponse(false, null, "Error updating user profile"));
    }
  },
);

router.patch(
  "/",
  authenticate(),
  modifyTargetUser(),
  checkSchema(validator.PATCH),
  async (request, response) => {
    if (!request.body) {
      return response
        .status(400)
        .json(createResponse(false, null, "No data provided for update"));
    }

    const errors = validationResult(request);

    if (!errors.isEmpty()) {
      return response
        .status(400)
        .json(createResponse(false, null, errors.array()[0].msg));
    }

    try {
      const result = await Profile.update(request);

      if (result.affectedRows > 0) {
        return response
          .status(200)
          .json(createResponse(true, null, "Profile updated successfully"));
      }

      response
        .status(404)
        .json(createResponse(false, null, "Profile not found"));
    } catch (error) {
      console.log(error);

      let message = "Error updating user profile";

      if (error.message === "All fields are up to date") {
        message = error.message;
      }

      response.status(500).json(createResponse(false, null, message));
    }
  },
);

module.exports = router;
