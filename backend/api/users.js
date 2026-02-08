const express = require("express");
const router = express.Router();
const { User } = require("../sql/database.js");
const { v4: uuidv4 } = require("uuid");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/user.js");
const { createResponse } = require("../common/common.js");

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

module.exports = router;
