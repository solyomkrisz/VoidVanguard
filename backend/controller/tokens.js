import * as service from "../service/tokens.js";
import * as authService from "../service/auth.js";
import {
  createResponse,
  handleCaughtError,
  accessTokenLifetimeMin,
} from "../common/common.js";

export async function refresh(request, response) {
  const token = request?.cookies?.refresh_token;

  if (!token) {
    return response
      .status(400)
      .json(
        createResponse(
          false,
          { access_token: "" },
          "Unauthorized access, no token provided",
        ),
      );
  }
  try {
    const accessToken = await service.refresh(token);

    /** */
    response.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "strict",
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
