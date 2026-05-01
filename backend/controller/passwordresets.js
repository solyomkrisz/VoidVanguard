import * as service from "../service/passwordresets.js";
import {
  createResponse,
  handleCaughtError,
  handleSequelizeUniqueConstraintError,
  isSequelizeUniqueConstraintError,
} from "../common/common.js";
import Role from "../common/Role.js";
import * as CustomError from "../common/CustomError.js";

import { RateLimiterMemory } from "rate-limiter-flexible";
const resetLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 600, // per 600 seconds (10 min)
});
export const emailLimiter = new RateLimiterMemory({
  points: 3, // allow 3 attempts
  duration: 15 * 60, // per 15 minutes
});

export async function requestPasswordReset(request, response) {
  const ip = request.ip;
  const email = request.body.email;

  try {
    await resetLimiter.consume(ip);
    await emailLimiter.consume(email);
  } catch (error) {
    const retryAfter = Math.ceil((error?.msBeforeNext || 300000) / 1000);

    return response
      .status(200)
      .json(
        createResponse(
          true,
          { retryAfter },
          "An email has been sent to the provided email address",
        ),
      );
  }

  try {
    await service.createForUserWithEmail({ email });

    response
      .status(200)
      .json(
        createResponse(
          true,
          null,
          "An email has been sent to the provided email address",
        ),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function resetPassword(request, response) {
  try {
    const result = await service.resetPassword({
      token: request.body.token,
      password: request.body.password,
    });

    response
      .status(200)
      .json(createResponse(true, null, "Password successfully resetted"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
