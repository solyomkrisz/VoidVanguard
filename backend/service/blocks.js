import * as CustomError from "../common/CustomError.js";
import Blocks from "../sql/table/Blocks.js";
import Friends from "../sql/table/Friends.js";

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
