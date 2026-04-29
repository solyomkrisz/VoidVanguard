import * as CustomError from "../common/CustomError.js";
import Permission from "../common/Permission.js";
import Profiles from "../sql/table/Profiles.js";
import Users from "../sql/table/Users.js";
import * as friend from "./friends.js";
import * as block from "./blocks.js";
import Role from "../common/Role.js";

const DEFAULT_AVATAR_PATHS = Object.freeze([
  "/image/defaultPfp.png",
  "/image/defaultPfp2.png",
  "/image/defaultPfp3.png",
  "/image/defaultPfp4.png",
  "/image/defaultPfp5.png",
  "/image/defaultPfp6.png",
]);
const DEFAULT_AVATAR_PATH = DEFAULT_AVATAR_PATHS[0];

function isDefaultAvatarPath(path) {
  return typeof path === "string" && DEFAULT_AVATAR_PATHS.includes(path);
}

function normalizeAvatarSelection(body, { defaultOnMissing = false } = {}) {
  const normalized = { ...body };

  if (normalized.avatar != null && normalized.avatar !== "") {
    if (!isDefaultAvatarPath(normalized.avatar)) {
      throw CustomError.INVALID_REQUEST;
    }
  } else if (defaultOnMissing) {
    normalized.avatar = DEFAULT_AVATAR_PATH;
  }

  return normalized;
}

export async function createProfile({ userId, role, body }) {
  body = normalizeAvatarSelection(body, { defaultOnMissing: true });

  if (await Profiles.exists(userId)) {
    await updateProfile({ userId, role, body });

    return await getProfile({
      userId,
      requesterId: userId,
      role,
    });
  }

  if (!body.display_name || !String(body.display_name).trim()) {
    const userPayload = await Users.payload(userId);
    body.display_name = userPayload?.username || body.display_name;
  }

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

  const profile = await getProfile({
    userId,
    requesterId: userId,
    role,
  });

  return profile;
}

export async function getFullProfile({ userId }) {
  const row = await Profiles._select(userId);

  if (!row) {
    throw CustomError.PROFILE_NOT_FOUND;
  }

  return row;
}

export async function updateProfile({ userId, role, body }) {
  body = normalizeAvatarSelection(body);

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

export async function searchFor({ query, page = 1, limit = 20 }) {
  const safePage = Number.isFinite(Number(page))
    ? Math.max(1, Number(page))
    : 1;
  const safeLimit = Number.isFinite(Number(limit))
    ? Math.min(50, Math.max(1, Number(limit)))
    : 20;

  const offset = (safePage - 1) * safeLimit;
  const rows = await Users.search(query, {
    limit: safeLimit,
    offset,
  });
  const total = await Users.countForSearch(query);

  const profiles = rows.map((row) => ({
    user_id: row.id,
    avatar: row.has_profile ? row.avatar || "/image/defaultPfp.png" : "",
    display_name: row.display_name || row.username,
    has_profile: row.has_profile === 1,
  }));

  const hasNext = offset + profiles.length < total;

  return {
    profiles,
    page: safePage,
    limit: safeLimit,
    hasNext,
  };
}

export async function getProfile({ userId, requesterId, role = -1 }) {
  const user = await Users.payload(userId);
  if (!user) {
    throw CustomError.USER_NOT_FOUND;
  }

  const profile = await Profiles._select(userId);

  if (!profile) {
    const friendshipStatus = await friend.getFriendshipStatus({
      initiatorId: requesterId,
      recipientId: userId,
    });

    const blockStatus = await block.getBlockStatus({
      initiatorId: requesterId,
      recipientId: userId,
    });

    return {
      user_id: userId,
      username: user?.username || "",
      avatar: "",
      display_name: user?.username || "",
      description: "",
      visibility: "private",
      friendship_status: friendshipStatus,
      block_status: blockStatus,
      has_profile: false,
    };
  }

  const { avatar, display_name, description, visibility } = profile;

  const friendshipStatus = await friend.getFriendshipStatus({
    initiatorId: requesterId,
    recipientId: userId,
  });

  let blockStatus = await block.getBlockStatus({
    initiatorId: requesterId,
    recipientId: userId,
  });

  // const friendListPreview = await friend.list({ userId, limit: 6 });

  if (
    userId === requesterId ||
    (visibility === "friends-only" && friendshipStatus === "accepted") ||
    visibility === "public" ||
    role >= Role.ADMIN
  ) {
    return {
      user_id: userId,
      username: user?.username || "",
      avatar,
      display_name,
      description,
      visibility,
      friendship_status: friendshipStatus,
      block_status: blockStatus,
      has_profile: true,
      // friend_list_preview: friendListPreview,
    };
  }

  return {
    user_id: userId,
    username: user?.username || "",
    avatar,
    display_name,
    description: "",
    visibility,
    friendship_status: friendshipStatus,
    block_status: blockStatus,
    has_profile: true,
    // friend_list_preview: friendListPreview,
  };
}
