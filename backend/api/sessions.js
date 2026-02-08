const express = require("express");
const router = express.Router();
const { User } = require("../sql/database.js");
const {
  createResponse,
  clearRefreshTokenCookie,
  Token,
} = require("../common/common.js");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/session.js");

router.post("/", checkSchema(validator.POST), async (request, response) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response
      .status(400)
      .json(createResponse(false, null, errors.array()[0].msg));
  }
  const { username, password } = request.body;

  let payload = null;
  try {
    payload = await User.login(username, password);
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .json(
        createResponse(false, null, "Unexpected error occurred during login"),
      );
  }
  if (payload) {
    const accessToken = Token.get(payload);
    const refreshToken = Token.get(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    response.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "Strict",
      path: "/api/tokens",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return response
      .status(200)
      .json(
        createResponse(true, { access_token: accessToken }, "Login successful"),
      );
  }
  response
    .status(401)
    .json(createResponse(false, null, "Invalid username or password"));
});

router.delete("/", (request, response) => {
  clearRefreshTokenCookie(response);
  response
    .status(200)
    .json(createResponse(true, { access_token: "" }, "Logout successful"));
});

module.exports = router;
