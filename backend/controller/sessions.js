import * as service from "../service/auth.js";
import {
  createResponse,
  handleCaughtError,
  accessTokenLifetimeMin,
} from "../common/common.js";

export async function login(request, response) {
  try {
    const ip = request.ip ?? null;
    const userAgent = request.headers["user-agent"] ?? null;

    const { accessToken, refreshToken, exp } = await service.login({
      username: request.body.username,
      password: request.body.password,
      ip,
      userAgent,
    });

    response.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "Strict",
      path: "/api/tokens",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "Strict",
      path: "/",
      maxAge: accessTokenLifetimeMin * 60 * 1000,
    });

    console.log("Refresh és access token cookie-k beállítva...");

    response
      .status(200)
      .json(
        createResponse(true, { access_token: accessToken }, "Login successful"),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function destroyAllSessions(request, response) {
  try {
    service.logout(response);

    const userId = request?.targetUser?.id;

    if (userId) {
      await service.destroyAllSessions({ userId });
    }

    response
      .status(200)
      .json(createResponse(true, null, "Successfully ended all sessions"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}