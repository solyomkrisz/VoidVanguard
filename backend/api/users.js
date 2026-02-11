const express = require("express");
const router = express.Router();
const { User } = require("../sql/database.js");
const { v4: uuidv4 } = require("uuid");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/user.js");
const { createResponse, authenticate } = require("../common/common.js");

router.get("/:id", validator.GET, async (request, response) => {
  if (!request.valid) {
    return response
      .status(400)
      .json(createResponse(false, null, "Invalid user ID"));
  }
  try {
    const result = await User.select(request.params.id);
    if (result) {
      response.status(200).json(createResponse(true, result));
    }
    response.status(404).json(createResponse(false, null, "User not found"));
  } catch (error) {
    response
      .status(500)
      .json(createResponse(false, null, "We couldn't retrieve the user"));
  }
});

router.post("/", checkSchema(validator.POST), async (request, response) => {
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
});

router.patch(
  "/",
  authenticate(),
  checkSchema(validator.POST),
  async (request, response) => {
    const fields = Object.keys(request.body).filter(
      (e) => request.body[e] !== "@" && !Number.isNaN(request.body[e]),
    );
    const errors = validationResult(request)
      .array()
      .filter(
        (e) =>
          (e.path === "passwordConfirm" && fields.includes("password")) ||
          fields.includes(e.path),
      );
    if (errors.length > 0) {
      return response
        .status(400)
        .json(createResponse(false, null, errors[0].msg));
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

module.exports = router;
