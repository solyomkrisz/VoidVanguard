const express = require("express");
const router = express.Router();
const { User, Token } = require("../sql/database.js");
const {
  createResponse,
  authenticate,
  clearRefreshTokenCookie,
} = require("../common/common.js");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/session.js");

router.post(
  "/",
  authenticate({
    onValidAccessToken: (_, response, _1) => {
      response
        .status(200)
        .json(createResponse(true, null, "Already logged in"));
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

      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + 7 * 24 * 60 * 60;

      const refreshToken = Token.get(
        payload,
        iat,
        exp,
        process.env.REFRESH_TOKEN_SECRET,
      );
      try {
        await Token.revokeAll(payload.sub);
        await Token.save(payload.sub, refreshToken, exp, iat);
      } catch (error) {
        console.log(error);
        return response
          .status(500)
          .json(
            createResponse(
              false,
              null,
              "Unexpected error occurred during login",
            ),
          );
      }
      response.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "Strict",
        path: "/api/tokens",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return response
        .status(200)
        .json(
          createResponse(
            true,
            { access_token: accessToken },
            "Login successful",
          ),
        );
    }
    response
      .status(401)
      .json(createResponse(false, null, "Invalid username or password"));
  },
);

router.delete("/", (request, response) => {
  clearRefreshTokenCookie(response);
  response
    .status(200)
    .json(createResponse(true, { access_token: "" }, "Logout successful"));
});

module.exports = router;
