import * as CustomError from "../common/CustomError.js";
import Users from "../sql/table/Users.js";
import Friends from "../sql/table/Friends.js";
import * as block from "./blocks.js";

export async function getSummary(userId, include = []) {
  const result = {};

  if (include.includes("incomingCount")) {
    result.incomingCount = await Friends.countAllIncoming(userId);
  }

  if (include.includes("friendCount")) {
    result.friendCount = await Friends.countAll(userId);
  }

  if (include.includes("pendingCount")) {
    result.pendingCount = await Friends.countAllPending(userId);
  }

  return result;
}

export async function getFriendshipStatus({ aId, bId }) {
  const row = await Friends.get(aId, bId);

  if (!row) return "not-friends";

  const { status, initiator_id } = row;

  if (status === "pending") {
    return initiator_id === aId ? "sent" : "received";
  }

  return status;
}

export async function checkFriendExists({ aId, bId }) {
  const exists = await Friends.exists(aId, bId);
  return exists;
}

export async function sendFriendRequest({ initiatorId, recipientId }) {
  if (initiatorId === recipientId) {
    throw CustomError.TEST;
  }

  const exists = await Users.exists(recipientId);

  if (!exists) {
    throw CustomError.TEST;
  }

  if (
    await checkFriendExists({
      aId: initiatorId,
      bId: recipientId,
    })
  ) {
    throw CustomError.TEST;
  }

  await block.checkBlockStatus({ initiatorId, recipientId });

  await Friends.initiate(initiatorId, recipientId);
}

export async function acceptFriendRequest({ initiatorId, recipientId }) {
  const result = await Friends.accept({ initiatorId, recipientId });

  if (result.affectedRows === 0) {
    throw CustomError.TEST;
  }

  return true;
}

export async function deleteFriendship({ aId, bId }) {
  const result = await Friends.delete(aId, bId);

  if (result.affectedRows === 0) {
    throw CustomError.TEST;
  }

  return true;
}
