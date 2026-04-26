import bcrypt from "bcrypt";
import * as CustomError from "../common/CustomError.js";
import Users from "../sql/table/Users.js";
import RefreshTokens from "../sql/table/RefreshTokens.js";
import Password from "../common/Password.js";
import Token from "../common/Token.js";

export async function login({ username, password }) {
  const user = await Users._selectByUsername(username);

  if (!user) {
    throw CustomError.INVALID_CREDENTIALS;
  }

  const match = await Password.compare(password, user.password_hash);

  if (!match) {
    throw CustomError.INVALID_CREDENTIALS;
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  const accessToken = Token.get(payload);

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 7 * 24 * 60 * 60;

  const refreshToken = Token.get(
    payload,
    iat,
    exp,
    process.env.REFRESH_TOKEN_SECRET,
  );

  await RefreshTokens.revokeAll(user.id);

  const refreshTokenHash = Token.hash(refreshToken);

  RefreshTokens.save({
    userId: user.id,
    tokenHash: refreshTokenHash,
    exp: new Date(exp * 1000),
    iat: new Date(iat * 1000),
  });

  return {
    accessToken,
    refreshToken,
    exp,
  };
}

export function logout(response) {
  response.cookie("refresh_token", "", {
    httpOnly: true,
    maxAge: 0,
    expires: new Date(0),
    path: "/api/tokens",
  });

  response.cookie("access_token", "", {
    httpOnly: true,
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });
}

export async function destroyAllSessions({ userId }) {
  const result = await RefreshTokens.deleteAll(userId);
  return result;
}
