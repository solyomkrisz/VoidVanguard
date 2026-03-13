import express from "express";
import * as service from "../service/tokens.js";
import * as authService from "../service/auth.js";
import { createResponse, handleCaughtError } from "../common/common.js";

const router = express.Router();

router.get("/", async (request, response) => {
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
});

export default router;
