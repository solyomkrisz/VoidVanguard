import express from "express";
import * as service from "../service/auth.js";
import {
  createResponse,
  authenticate,
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

    try {
      const { accessToken, refreshToken, exp } = await service.login({
        username: request.body.username,
        password: request.body.password,
      });

      response.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "Strict",
        path: "/api/tokens",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      response
        .status(200)
        .json(
          createResponse(
            true,
            { access_token: accessToken },
            "Login successful",
          ),
        );
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

router.delete("/", (request, response) => {
  service.logout(response);

  response
    .status(200)
    .json(createResponse(true, { access_token: "" }, "Logout successful"));
});

export default router;
