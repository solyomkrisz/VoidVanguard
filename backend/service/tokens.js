import bcrypt from "bcrypt";
import * as CustomError from "../common/CustomError.js";
import Token from "../common/Token.js";
import RefreshTokens from "../sql/table/RefreshTokens.js";
import Users from "../sql/table/Users.js";

export async function find({ userId }) {
  const row = await RefreshTokens.findForUser(userId);
  return row;
}

export async function refresh(refreshToken) {
  let payload;

  try {
    payload = Token.verify(refreshToken);
  } catch {
    throw CustomError.INVALID_TOKEN;
  }

  if (!payload?.id) {
    throw CustomError.INVALID_TOKEN;
  }

  const row = await find({ userId: payload.id });

  if (!row) {
    throw CustomError.INVALID_TOKEN;
  }

  const { token_hash } = row;

  const match = await bcrypt.compare(refreshToken, token_hash);

  if (!match) {
    throw CustomError.INVALID_TOKEN;
  }

  const user = await Users.payload(payload.id);

  if (!user) {
    throw CustomError.USER_NOT_FOUND;
  }

  const accessToken = Token.get(user);

  return accessToken;
}
