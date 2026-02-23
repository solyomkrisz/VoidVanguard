const express = require("express");
const router = express.Router();
const Token = require("../common/Token.js");
const RefreshTokens = require("../sql/table/RefreshTokens.js");
const Users = require("../sql/table/Users.js");
const {
  createResponse,
  authenticate,
  clearRefreshTokenCookie,
  handleExpressValidatorErrors,
  handleCaughtError,
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

    if (!errors.isEmpty())
      return handleExpressValidatorErrors(response, errors);

    let payload = null;

    try {
      payload = await Users.login(request);
    } catch (error) {
      return handleCaughtError(response, error);
    }
    const access_token = Token.get(payload);

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 7 * 24 * 60 * 60;

    //prettier-ignore
    const refresh_token = Token.get(payload, iat, exp, process.env.REFRESH_TOKEN_SECRET);

    try {
      await RefreshTokens.revokeAll(payload.sub);
      await RefreshTokens.save(payload.sub, refresh_token, exp, iat);
    } catch (error) {
      return handleCaughtError(response, error);
    }

    response.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      sameSite: "Strict",
      path: "/api/tokens",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response
      .status(200)
      .json(createResponse(true, { access_token }, "Login successful"));
  },
);

router.delete("/", (request, response) => {
  clearRefreshTokenCookie(response);
  response
    .status(200)
    .json(createResponse(true, { access_token: "" }, "Logout successful"));
});

module.exports = router;
