import * as service from "../service/admin.js";
import {
  createResponse,
  handleCaughtError,
  handleSequelizeUniqueConstraintError,
  isSequelizeUniqueConstraintError,
} from "../common/common.js";
import Role from "../common/Role.js";
import * as CustomError from "../common/CustomError.js";

export async function getBanStatus(request, response) {
  try {
    const userId = request?.query?.targetUserId;

    const result = await service.getBanStatus({ userId });

    response
      .status(200)
      .json(
        createResponse(true, result, "User ban status successfully retrieved"),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function lazySelectUserBans(request, response) {
  try {
    const userId = request?.query?.targetUserId;

    const result = await service.lazySelectUserBans({
      userId,
      page: Number(request.query?.page || 1),
      limit: Number(request.query?.limit || 20),
    });

    response
      .status(200)
      .json(createResponse(true, result, "User bans successfully retrieved"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function banUser(request, response) {
  try {
    let expiresAt = null;

    if (request.body.expiresAt) {
      expiresAt = request.body.expiresAt.replace("T", " ") + ":00";
    }

    const result = await service.banUser({
      userId: request.body.userId,
      reason: request.body.reason,
      expiresAt,
      createdBy: request.user.id,
      creatorRole: request.user.role,
    });

    response
      .status(200)
      .json(createResponse(true, null, "User successfully banned"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function unbanUser(request, response) {
  try {
    const result = await service.unBanUser({
      userId: request.body.userId,
      revokedBy: request.user.id,
    });

    response
      .status(200)
      .json(createResponse(true, null, "User successfully unbanned"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
