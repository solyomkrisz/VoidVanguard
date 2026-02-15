const express = require("express");
const router = express.Router();
const { User } = require("../sql/database.js");
const { v4: uuidv4 } = require("uuid");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/user.js");
const {
  createResponse,
  authenticate,
  modifyTargetUser,
} = require("../common/common.js");

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
  async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response
        .status(400)
        .json(createResponse(false, null, errors.array()[0].msg));
    }
    const { username, email, gender, password } = request.body;
    try {
      await User.create(uuidv4(), username, email, gender, password);
      response
        .status(201)
        .json(createResponse(true, null, "User created successfully"));
    } catch (error) {
      console.log(error);
      if (
        error.name === "SequelizeUniqueConstraintError" ||
        error.code === "ER_DUP_ENTRY"
      ) {
        return response
          .status(400)
          .json(createResponse(false, null, "Username or email already taken"));
      }
      response
        .status(500)
        .json(
          createResponse(
            false,
            null,
            "Unexpected error occurred while creating user",
          ),
        );
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
        .json(
          createResponse(
            false,
            null,
            "No fields have been provided for update",
          ),
        );
    }
    const fields = Object.keys(request.body);
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response
        .status(400)
        .json(createResponse(false, null, errors.array()[0].msg));
    }
    try {
      const result = await User.update(request, fields);
      if (result.affectedRows > 0) {
        return response
          .status(200)
          .json(createResponse(true, null, "User updated successfully"));
      }
      response.status(404).json(createResponse(false, null, "User not found"));
    } catch (error) {
      console.log(error);
      let message = "Unexpected error occurred while updating user";
      if (error.code === "ER_DUP_ENTRY") {
        message = "Username or email already taken";
      }
      response.status(500).json(createResponse(false, null, message));
    }
  },
);

router.delete(
  "/",
  authenticate(),
  modifyTargetUser(),
  async (request, response) => {
    try {
      const result = await User.delete(request.targetUser.sub);
      if (result.affectedRows > 0) {
        return response
          .status(200)
          .json(createResponse(true, null, "User deleted successfully"));
      }
      response.status(404).json(createResponse(false, null, "User not found"));
    } catch (error) {
      console.log(error);
      response
        .status(500)
        .json(
          createResponse(
            false,
            null,
            "Unexpected error occurred while deleting user",
          ),
        );
    }
  },
);

module.exports = router;
