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

    const result = await lazySelectUserBans({
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
    response
      .status(200)
      .json(createResponse(true, null, "User successfully banned"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
