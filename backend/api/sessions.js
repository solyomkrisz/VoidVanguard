import express from "express";
import Token from "../common/Token.js";
import RefreshTokens from "../sql/table/RefreshTokens.js";
import Users from "../sql/table/Users.js";
import {
  createResponse,
  authenticate,
  clearRefreshTokenCookie,
  handleExpressValidatorErrors,
  handleCaughtError,
} from "../common/common.js";
import { checkSchema, validationResult } from "express-validator";
import * as validator from "../validator/session.js";

const router = express.Router();

router.post(
  "/",
  authenticate({
    onValidAccessToken: (request, response, _1) => {
      response
        .status(200)
        .json(createResponse(true, request.user, "Already logged in"));
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
      await RefreshTokens.revokeAll(payload.id);
      await RefreshTokens.save(payload.id, refresh_token, exp, iat);
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
  }
);

router.delete("/", (request, response) => {
  clearRefreshTokenCookie(response);
  response
    .status(200)
    .json(createResponse(true, { access_token: "" }, "Logout successful"));
});

export default router;
