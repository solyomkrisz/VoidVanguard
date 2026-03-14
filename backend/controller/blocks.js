import * as service from "../service/blocks.js";
import {
  createResponse,
  handleCaughtError,
  handleSequelizeUniqueConstraintError,
  isSequelizeUniqueConstraintError,
} from "../common/common.js";

export async function getBlockedUsers(request, response) {
  if (!request.valid) {
    return response
      .status(400)
      .json(createResponse(false, null, "Invalid user ID"));
  }

  try {
    const result = await service.getBlockedUsers({
      blockerId: request.targetUser.id,
    });

    response
      .status(200)
      .json(
        createResponse(true, result, "Blocked users retrieved successfully"),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function blockUser(request, response) {
  if (!request.valid) {
    return response
      .status(400)
      .json(createResponse(false, null, "Invalid user ID"));
  }

  try {
    await service.blockUser({
      blockerId: request.targetUser.id,
      blockedId: request.body.userId,
    });

    response
      .status(201)
      .json(createResponse(true, null, "User blocked successfully"));
  } catch (error) {
    if (isSequelizeUniqueConstraintError(error)) {
      return handleSequelizeUniqueConstraintError(
        response,
        "This user has already been blocked",
      );
    }
    handleCaughtError(response, error);
  }
}

export async function unblockUser(request, response) {
  if (!request.valid) {
    return response
      .status(400)
      .json(createResponse(false, null, "Invalid user ID"));
  }

  try {
    await service.unblockUser({
      blockerId: request.targetUser.id,
      blockedId: request.body.userId,
    });

    response
      .status(200)
      .json(createResponse(true, null, "User unblocked successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
