import * as service from "../service/tokens.js";
import * as authService from "../service/auth.js";
import {
  createResponse,
  handleCaughtError,
  accessTokenLifetimeMin,
} from "../common/common.js";
import * as CustomError from "../common/CustomError.js";

export async function refresh(request, response) {
  const token = request?.cookies?.refresh_token;

  try {
    if (!token) {
      throw CustomError.NO_REFRESH_TOKEN;
    }

    const accessToken = await service.refresh(token);

    /** */
    response.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "Strict",
      path: "/",
      maxAge: accessTokenLifetimeMin * 60 * 1000,
    });
    /** */

    response
      .status(200)
      .json(
        createResponse(
          true,
          { access_token: accessToken },
          "Access token refreshed successfully",
        ),
      );
  } catch (error) {
    authService.logout(response);
    handleCaughtError(response, error);
  }
}

export async function revokeSession(request, response) {
  const token = request?.cookies?.refresh_token;

  try {
    authService.logout(response);

    if (token) {
      await service.revokeSession(token);
    }

    response
      .status(200)
      .json(createResponse(true, null, "Successfully logged out"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
