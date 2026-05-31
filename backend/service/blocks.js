/**
 * Kezdobarat magyarazat:
 * Fajl: backend/service/blocks.js
 * Szerep: Felhasznalok kozotti tiltasi kapcsolatok uzleti logikaja es allapotosszegzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as CustomError from "../common/CustomError.js";
import Blocks from "../sql/table/Blocks.js";
import Friends from "../sql/table/Friends.js";

export async function lazySelectByTarget({ targetId, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;

  console.log("TARGET ID: ", targetId);

  let blocks, total;

  try {
    blocks = await Blocks.lazySelectByTarget(targetId, { offset, limit });
    total = await Blocks.count(targetId);
  } catch (error) {
    console.log(error);
    blocks = [];
    total = 0;
  }

  return {
    blocks,
    page,
    limit,
    total,
    hasNext: offset + blocks.length < total,
  };
}

export async function getSummary({ userId, requesterId, include = [] }) {
  const result = {};

  if (include.includes("status")) {
    result.status = await getBlockStatus({
      initiatorId: requesterId,
      recipientId: userId,
    });
  }

  return result;
}

export async function getBlockStatus({ initiatorId, recipientId }) {
  if (!initiatorId || !recipientId) {
    return "not-blocked";
  }

  // Két irányt kell ellenőrizni: lehet, hogy én tiltottam le őt, ő tiltott le engem, vagy mindkettő.
  const iniBlockedRec = await Blocks.isBlocked(initiatorId, recipientId);
  const recBlockedIni = await Blocks.isBlocked(recipientId, initiatorId);

  if (iniBlockedRec && recBlockedIni) {
    return "both-blocked";
  }

  if (iniBlockedRec) {
    return "you-blocked";
  }

  if (recBlockedIni) {
    return "got-blocked";
  }

  return "not-blocked";
}

export async function checkBlockStatus({ initiatorId, recipientId }) {
  if (!initiatorId || !recipientId) {
    return false;
  }

  // Itt nem státusz-szöveget adunk vissza, hanem a konkrét üzleti hibát dobjuk tovább.
  const iniBlockedRec = await Blocks.isBlocked(initiatorId, recipientId);
  const recBlockedIni = await Blocks.isBlocked(recipientId, initiatorId);

  if (iniBlockedRec && recBlockedIni) {
    throw CustomError.BOTH_BLOCKED;
  }

  if (iniBlockedRec) {
    throw CustomError.INI_BLOCKED_REC;
  }

  if (recBlockedIni) {
    throw CustomError.REC_BLOCKED_INI;
  }

  return false;
}

export async function blockUser({ blockerId, blockedId }) {
  if (blockerId === blockedId) {
    throw CustomError.CANNOT_BLOCK_YOURSELF;
  }

  // Tiltás előtt a barátságot takarítjuk, hogy a két kapcsolat ne üssön egymással.
  await Friends.delete(blockerId, blockedId);

  await Blocks.delete(blockerId, blockedId);

  return Blocks.create(blockerId, blockedId);
}

export async function unblockUser({ blockerId, blockedId }) {
  const result = await Blocks.delete(blockerId, blockedId);

  if (result.affectedRows === 0) {
    throw CustomError.UNABLE_TO_UNBLOCK;
  }

  return result;
}

export async function getBlockedUsers({ blockerId }) {
  const rows = await Blocks.getAllBlocked(blockerId);
  return rows;
}
