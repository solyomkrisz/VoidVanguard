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
    // authService.logout(response);
    handleCaughtError(response, error);
  }
}

export async function lazySelectActiveTokens(request, response) {
  try {
    const currentRefreshToken = request?.cookies?.refresh_token;

    const result = await service.lazySelectByUserId({
      userId: request?.targetUser?.id,
      currentRefreshToken,
      page: Number(request.query?.page || 1),
      limit: Number(request.query?.limit || 20),
    });

    response
      .status(200)
      .json(createResponse(true, result, "Active tokens fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function revokeSessionById(request, response) {
  try {
    const currentRefreshToken = request?.cookies?.refresh_token;

    const result = await service.revokeSessionById({
      id: request.params.id,
      userId: request.targetUser.id,
      currentRefreshToken,
    });

    response
      .status(200)
      .json(createResponse(true, result, "Session destroyed successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function revokeSessionByToken(request, response) {
  const token = request?.cookies?.refresh_token;

  try {
    authService.logout(response);

    if (token) {
      await service.revokeSessionByToken(token);
    }

    response
      .status(200)
      .json(createResponse(true, null, "Successfully logged out"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
