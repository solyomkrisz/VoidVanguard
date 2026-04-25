import * as service from "../service/passwordresets.js";
import {
  createResponse,
  handleCaughtError,
  handleSequelizeUniqueConstraintError,
  isSequelizeUniqueConstraintError,
} from "../common/common.js";
import Role from "../common/Role.js";
import * as CustomError from "../common/CustomError.js";

export async function requestPasswordReset(request, response) {
  try {
    const result = await service.createForUserWithEmail({
      email: request.body.email,
    });

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
