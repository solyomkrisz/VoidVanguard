import express from "express";
import Token from "../common/Token.js";
import RefreshTokens from "../sql/table/RefreshTokens.js";
import Users from "../sql/table/Users.js";
import { createResponse, clearRefreshTokenCookie } from "../common/common.js";

const router = express.Router();

// prettier-ignore
router.get("/", async (request, response) => {
  const token = request?.cookies?.refresh_token;

  if (!token) {
    return response
      .status(400)
      .json(
        createResponse(false, { access_token: "" }, "Unauthorized access, no token provided"),
      );
  }

  let payload = null;

  try {
    payload = Token.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    clearRefreshTokenCookie(response);
    return response.status(401).json(createResponse(false, { access_token: "" }, "Invalid or expired refresh token"));
  }

  if (!payload.id) {
    clearRefreshTokenCookie(response);
    return response.status(401).json(createResponse(false, { access_token: "" }, "Invalid refresh token payload"));
  }

  try {
    await RefreshTokens.find(payload.id, token);
  } catch (error) {
    console.log(error);
    return response.status(400).json(createResponse(false, { access_token: "" }, "Unauthorized access, invalid refresh token"));
  }

  let user = null;

  try { 
    user = await Users.payload(payload.id);
  } 
  catch (error) {
    return response.status(500).json(createResponse(false, { access_token: "" }, "Unexpected error occurred during token verification"));
  }

  if (!user) {
    return response.status(401).json(createResponse(false, { access_token: "" }, "User associated with token no longer exists"));
  }
  payload = user;
  const accessToken = Token.get(payload);
  response.status(200).json(createResponse(true, { access_token: accessToken }, "Access token refreshed successfully"));
});

export default router;
