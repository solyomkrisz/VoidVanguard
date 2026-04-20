import * as CustomError from "../common/CustomError.js";
import Users from "../sql/table/Users.js";
import Friends from "../sql/table/Friends.js";
import * as block from "./blocks.js";

export async function lazySelectByTarget({
  targetId,
  page = 1,
  limit = 20,
  requesterId = null,
  status = "accepted",
  direction = null,
}) {
  if (!["accepted", "pending"].includes(status)) {
    throw CustomError.INVALID_REQUEST;
  }

  if (!["both", "incoming", "outgoing", null].includes(direction)) {
    throw CustomError.INVALID_REQUEST;
  }

  const offset = (page - 1) * limit;

  let friends, total;

  try {
    await block.checkBlockStatus({
      initiatorId: requesterId,
      recipientId: targetId,
    });

    friends = await Friends.list(targetId, {
      limit,
      offset,
      status,
      direction,
    });
    total = await Friends.count(targetId, { status, direction });
  } catch {
    friends = [];
    total = 0;
  }

  return {
    friends,
    page,
    limit,
    total,
    hasNext: offset + friends.length < total,
  };
}

export async function getSummary({ userId, requesterId, include = [] }) {
  const result = {};

  if (include.includes("incomingCount") && userId === requesterId) {
    result.incomingCount = await Friends.countAllIncoming(userId);
  }

  if (include.includes("friendCount") && userId === requesterId) {
    result.friendCount = await Friends.countAll(userId);
  }

  if (include.includes("pendingCount") && userId === requesterId) {
    result.pendingCount = await Friends.countAllPending(userId);
  }

  if (include.includes("preview")) {
    try {
      await block.checkBlockStatus({
        initiatorId: requesterId,
        recipientId: userId,
      });

      result.preview = await list({ userId, limit: 6 });
    } catch {
      result.preview = [];
    }
  }

  if (include.includes("status")) {
    result.status = await getFriendshipStatus({
      initiatorId: requesterId,
      recipientId: userId,
    });
  }

  return result;
}

export async function getFriendshipStatus({ initiatorId, recipientId }) {
  if (!initiatorId || !recipientId) {
    return "not-friends";
  }

  const row = await Friends.get(initiatorId, recipientId);

  if (!row) return "not-friends";

  const { status, initiator_id } = row;

  if (status === "pending") {
    return initiator_id === initiatorId ? "sent" : "received";
  }

  return status;
}

export async function list({ userId, limit = null, orderBy = null }) {
  const rows = await Friends.list(userId, { limit, orderBy });
  return rows;
}

export async function getAllFriends({ userId }) {
  const rows = await Friends.getAll(userId);
  return rows;
}

export async function checkFriendExists({ aId, bId }) {
  const exists = await Friends.exists(aId, bId);
  return exists;
}

export async function sendFriendRequest({ initiatorId, recipientId }) {
  if (initiatorId === recipientId) {
    throw CustomError.CANNOT_FRIEND_YOURSELF;
  }

  const exists = await Users.exists(recipientId);

  if (!exists) {
    throw CustomError.USER_NOT_FOUND;
  }

  if (
    await checkFriendExists({
      aId: initiatorId,
      bId: recipientId,
    })
  ) {
    throw CustomError.FRIENSHIP_ALREADY_EXISTS;
  }

  await block.checkBlockStatus({ initiatorId, recipientId });

  await Friends.initiate(initiatorId, recipientId);
}

export async function acceptFriendRequest({ initiatorId, recipientId }) {
  const result = await Friends.accept(initiatorId, recipientId);

  if (result.affectedRows === 0) {
    throw CustomError.UNABLE_TO_ACCEPT_FR_REQ;
  }

  return true;
}

export async function deleteFriendship({ aId, bId }) {
  const result = await Friends.delete(aId, bId);

  if (result.affectedRows === 0) {
    throw CustomError.UNABLE_TO_REMOVE_FRIEND;
  }

  return true;
}
