import Users from "../sql/table/Users.js";
import Bans from "../sql/table/Bans.js";
import RefreshTokens from "../sql/table/RefreshTokens.js";
import * as CustomError from "../common/CustomError.js";
import { v4 as uuidv4 } from "uuid";

export async function banUser({ userId, reason, expiresAt, createdBy }) {
  const user = await Users.exists(userId);
  if (!user) {
    throw CustomError.USER_NOT_FOUND;
  }

  // prevent duplicate active bans
  const alreadyBanned = await Bans.isBanned(userId);
  if (alreadyBanned) {
    throw CustomError.ALREADY_BANNED;
  }

  const id = uuidv4();

  const result = await Bans.banUser({
    id,
    userId,
    reason,
    expiresAt,
    createdBy,
  });

  await RefreshTokens.revokeAll(userId);

  return result;
}

export async function unBanUser({ userId, revokedBy }) {
  const user = await Users.exists(userId);
  if (!user) {
    throw CustomError.USER_NOT_FOUND;
  }

  // check if user is banned
  const activeBan = await Bans.isBanned(userId);
  if (!activeBan) {
    throw CustomError.NOT_BANNED;
  }

  const result = await Bans.unBanUser(revokedBy, userId);

  return result;
}

export async function getBanStatus({ userId }) {
  const user = await Users.exists(userId);
  if (!user) {
    throw CustomError.USER_NOT_FOUND;
  }

  const activeBan = await Bans.isBanned(userId);

  if (!activeBan) {
    return {
      is_banned: false,
    };
  }

  return {
    is_banned: true,
    reason: activeBan.reason,
  };
}

export async function lazySelectUserBans({ userId, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;

  const bans = await Bans.lazySelectByUserId(userId, { limit, offset });
  const total = await Bans.getTotalBansForUser(userId);

  return {
    bans,
    page,
    limit,
    total,
    hasNext: offset + bans.length < total,
  };
}
