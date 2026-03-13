import * as CustomError from "../common/CustomError.js";
import Blocks from "../sql/table/Blocks.js";
import Friends from "../sql/table/Friends.js";

export async function checkBlockStatus({ initiatorId, recipientId }) {
  if (!initiatorId || !recipientId) {
    return false;
  }

  const iniBlockedRec = await Blocks.isBlocked(initiatorId, recipientId);

  if (iniBlockedRec) {
    throw CustomError.INI_BLOCKED_REC;
  }

  const recBlockedIni = await Blocks.isBlocked(recipientId, initiatorId);

  if (recBlockedIni) {
    throw CustomError.REC_BLOCKED_INI;
  }

  return false;
}

export async function blockUser({ blockerId, blockedId }) {
  if (blockerId === blockedId) {
    throw CustomError.TEST;
  }

  await Friends.delete(blockerId, blockedId);

  await Blocks.delete(blockerId, blockedId);

  return Blocks.create(blockerId, blockedId);
}

export async function unblockUser({ blockerId, blockedId }) {
  const result = await Blocks.delete(blockerId, blockedId);

  if (result.affectedRows === 0) {
    throw CustomError.TEST;
  }

  return result;
}

export async function getBlockedUsers({ blockerId }) {
  const rows = await Blocks.getAllBlocked(blockerId);
  return rows;
}
