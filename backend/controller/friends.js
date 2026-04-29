import * as service from "../service/friends.js";
import {
  createResponse,
  handleCaughtError,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
} from "../common/common.js";

export async function lazySelectByTarget(request, response) {
  try {
    const statusFilter = request?.query?.status;
    const directionFilter = request?.query?.direction;

    const result = await service.lazySelectByTarget({
      requesterId: request?.targetUser?.id ?? null,
      targetId: request.query.targetId,
      page: Number(request.query?.page || 1),
      limit: Number(request.query?.limit || 20),
      status: statusFilter,
      direction: directionFilter,
    });

    response
      .status(200)
      .json(createResponse(true, result, "Friends fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function summary(request, response) {
  try {
    const requesterId = request?.targetUser?.id ?? null;
    const userId = request.params.id;
    const include = (request.query.include || "").split(",");

    const result = await service.getSummary({ userId, requesterId, include });

    response
      .status(200)
      .json(createResponse(true, result, "Data successfully fetched"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function sendFriendRequest(request, response) {
  try {
    await service.sendFriendRequest({
      initiatorId: request.targetUser.id,
      recipientId: request.body.userId,
    });

    response
      .status(200)
      .json(createResponse(true, null, "Friend request sent successfully."));
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return response
        .status(404)
        .json(createResponse(false, null, "Target user not found."));
    }
    if (isSequelizeUniqueConstraintError(error)) {
      return handleSequelizeUniqueConstraintError(
        response,
        "A friend request already exists or you are already friends with this user.",
      );
    }
    handleCaughtError(response, error);
  }
}

export async function acceptFriendRequest(request, response) {
  try {
    await service.acceptFriendRequest({
      initiatorId: request.body.userId,
      recipientId: request.targetUser.id,
    });

    response
      .status(200)
      .json(createResponse(true, null, "Friend request accepted successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function removeFriend(request, response) {
  try {
    await service.deleteFriendship({
      aId: request.targetUser.id,
      bId: request.body.userId,
    });

    response
      .status(200)
      .json(createResponse(true, null, "Friendship deleted successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
