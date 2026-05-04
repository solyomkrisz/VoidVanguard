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
        createResponse(
          true,
          result,
          "A felhasználó kitiltási állapota sikeresen lekérve",
        ),
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
      .json(
        createResponse(
          true,
          result,
          "A felhasználó kitiltásai sikeresen lekérve",
        ),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function banUser(request, response) {
  try {
    let expiresAt = null;

    if (request.body.expiresAt) {
      const normalized = String(request.body.expiresAt).trim().replace("T", " ");

      if (normalized.length === 16) {
        expiresAt = `${normalized}:00`;
      } else if (normalized.length >= 19) {
        expiresAt = normalized.slice(0, 19);
      } else {
        expiresAt = normalized;
      }
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
      .json(createResponse(true, null, "A felhasználó sikeresen kitiltva"));
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
      .json(
        createResponse(
          true,
          null,
          "A felhasználó kitiltása sikeresen feloldva",
        ),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}
