import * as service from "../service/auth.js";
import {
  createResponse,
  handleCaughtError,
  accessTokenLifetimeMin,
} from "../common/common.js";

export async function login(request, response) {
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

    /** */
    response.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: accessTokenLifetimeMin * 60 * 1000,
      path: "/",
    });
    /** */

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
    const userId = request?.targetUser?.id;

    if (userId) {
      await service.destroyAllSessions({ userId });
    }

    service.logout(response);

    response.sendStatus(204);
  } catch (error) {
    handleCaughtError(response, error);
  }
}
