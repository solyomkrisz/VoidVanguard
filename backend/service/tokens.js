import bcrypt from "bcrypt";
import * as CustomError from "../common/CustomError.js";
import Token from "../common/Token.js";
import RefreshTokens from "../sql/table/RefreshTokens.js";
import Users from "../sql/table/Users.js";

export async function find({ userId }) {
  const row = await RefreshTokens.findForUser(userId);
  return row;
}

export async function findHash({ tokenHash }) {
  const row = await RefreshTokens.findByHash(tokenHash);
  return row;
}

export async function deleteAll({ userId } = {}) {
  const [result] = await RefreshTokens.deleteAll(userId);
  return result;
}

export async function refresh(refreshToken) {
  let payload;

  try {
    payload = Token.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw CustomError.REFRESH_TOKEN_EXPIRED;
    }

    throw CustomError.INVALID_TOKEN;
  }

  if (!payload?.id) {
    throw CustomError.INVALID_TOKEN;
  }

  const refreshTokenHash = Token.hash(refreshToken);

  const row = await findHash({ tokenHash: refreshTokenHash });

  if (!row) {
    throw CustomError.INVALID_TOKEN;
  }

  const user = await Users.payload(payload.id);

  if (!user) {
    throw CustomError.USER_NOT_FOUND;
  }

  const accessToken = Token.get(user);

  return accessToken;
}

export async function lazySelectByUserId({
  userId,
  currentRefreshToken = null,
  page = 1,
  limit = 20,
} = {}) {
  const offset = (page - 1) * limit;

  const currentRefreshTokenHash = currentRefreshToken
    ? Token.hash(currentRefreshToken)
    : null;

  const tokens = await RefreshTokens.lazySelectActiveByUserId(
    userId,
    currentRefreshTokenHash,
    {
      limit,
      offset,
    },
  );
  const total = await RefreshTokens.getTotalActiveTokensByUserId(userId);

  return {
    tokens,
    page,
    limit,
    total,
    hasNext: offset + tokens.length < total,
  };
}

export async function revokeSessionById({ id, userId, currentRefreshToken }) {
  let currentSession = {};

  if (currentRefreshToken) {
    const currentRefreshTokenHash = Token.hash(currentRefreshToken);
    currentSession = await RefreshTokens.findByHash(currentRefreshTokenHash);
  }

  console.log("CURRENT TOKEN: ", currentRefreshToken);
  console.log("CURRENT SESSION: ", currentSession);

  const result = await RefreshTokens.deleteById(id, userId);

  let deleted = false,
    logout = false;

  if (result.affectedRows >= 1) {
    deleted = true;

    if (currentSession?.id === id) {
      logout = true;
    }
  }

  return { deleted, logout };
}

export async function revokeSessionByToken(refreshToken) {
  const tokenHash = Token.hash(refreshToken);
  const result = await RefreshTokens.deleteByTokenHash(tokenHash);

  return true;
}
