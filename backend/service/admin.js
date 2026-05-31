/**
 * Kezdobarat magyarazat:
 * Fajl: backend/service/admin.js
 * Szerep: Admin tiltasi muveletek uzleti szabalyai szerepkor- es sessionkezelessel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Users from "../sql/table/Users.js";
import Bans from "../sql/table/Bans.js";
import RefreshTokens from "../sql/table/RefreshTokens.js";
import * as CustomError from "../common/CustomError.js";
import { v4 as uuidv4 } from "uuid";
import Role from "../common/Role.js";

export async function banUser({
  userId,
  reason,
  expiresAt,
  createdBy,
  creatorRole,
}) {
  // A banolas itt ellenorzi a szerepkor-hierarchiat, a duplikalt tiltast, majd a vegen minden aktiv sessiont is ervenytelenit.
  if (userId === createdBy) {
    throw CustomError.CANNOT_BAN_YOURSELF;
  }

  const user = await Users.select(userId);
  if (!user) {
    throw CustomError.USER_NOT_FOUND;
  }

  if (parseInt(user.role) >= creatorRole) {
    throw CustomError.BAN_HIGHER_ROLE_ERROR;
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

  if (!result) {
    throw CustomError.ALREADY_BANNED;
  }

  await RefreshTokens.revokeAll(userId);

  return result;
}

export async function unBanUser({ userId, revokedBy }) {
  // Feloldas elott azt is megnezzuk, hogy letezik-e a user es van-e egyaltalan aktiv tiltasa.
  const user = await Users.exists(userId);
  if (!user) {
    throw CustomError.USER_NOT_FOUND;
  }

  // check if user is banned
  const activeBan = await Bans.isBanned(userId);
  if (!activeBan) {
    throw CustomError.NOT_BANNED;
  }

  const result = await Bans.unBanUser(userId, revokedBy);

  if (!result) {
    throw CustomError.UNABLE_TO_UNBAN;
  }

  return result;
}

export async function getBanStatus({ userId }) {
  // A frontendnek egyszeru statuszobjektum kell, nem az egesz tiltasi rekord.
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
  // A tiltasi elozmeny ugyanugy lapozott listakent jon vissza, mint a tobbi nagyobb gyujtemeny.
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
