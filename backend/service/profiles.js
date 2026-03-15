import * as CustomError from "../common/CustomError.js";
import Permission from "../common/Permission.js";
import Profiles from "../sql/table/Profiles.js";
import * as friend from "./friends.js";
import * as block from "./blocks.js";
import Role from "../common/Role.js";

export async function createProfile({ userId, role, body }) {
  const data = {};

  for (const column in body) {
    if (!Profiles.hasPermission(column, role, Permission.W)) {
      continue;
    }

    data[column] = body[column];
  }

  if (!Object.keys(data).length) {
    throw CustomError.NO_DATA_CHANGE;
  }

  const result = await Profiles.create(userId, data);

  if (!result) {
    throw CustomError.TEST;
  }

  return {
    id: userId,
  };
}

export async function getFullProfile({ userId }) {
  const row = await Profiles._select(userId);

  if (!row) {
    throw CustomError.PROFILE_NOT_FOUND;
  }

  return row;
}

export async function updateProfile({ userId, role, body }) {
  const profile = await getFullProfile({ userId });
  const updates = {};

  for (const column in body) {
    if (!Profiles.hasPermission(column, role, Permission.W)) {
      continue;
    }

    if (body[column] === profile[column]) {
      continue;
    }

    updates[column] = body[column];
  }

  if (!Object.keys(updates).length) {
    throw CustomError.NO_DATA_CHANGE;
  }

  const result = await Profiles.update(userId, updates);

  if (!result) {
    throw CustomError.TEST;
  }

  return result;
}

export async function deleteProfile({ userId }) {
  if (!(await Profiles.delete(userId))) {
    throw CustomError.PROFILE_NOT_FOUND;
  }

  return null;
}

export async function searchFor({ query }) {
  const rows = await Profiles.like(query);
  return rows;
}

export async function getProfile({ userId, requesterId, role = -1 }) {
  const profile = await getFullProfile({ userId });

  if (!profile) {
    throw CustomError.PROFILE_NOT_FOUND;
  }

  const { avatar, display_name, description, visibility } = profile;

  const friendshipStatus = await friend.getFriendshipStatus({
    initiatorId: requesterId,
    recipientId: userId,
  });

  let blockStatus = false;

  try {
    await block.checkBlockStatus({
      initiatorId: requesterId,
      recipientId: userId,
    });
  } catch {
    blockStatus = true;
  }

  const allFriends = await friend.getAllFriends({ userId });

  if (
    userId === requesterId ||
    (visibility === "friends-only" && friendshipStatus === "accepted") ||
    visibility === "public" ||
    role >= Role.ADMIN
  ) {
    return {
      user_id: userId,
      avatar,
      display_name,
      description,
      friendship_status: friendshipStatus,
      is_blocked: blockStatus,
      all_friends: allFriends,
    };
  }

  return {
    user_id: userId,
    avatar,
    display_name,
    description: "",
    friendship_status: friendshipStatus,
    is_blocked: blockStatus,
    all_friends: allFriends,
  };
}
