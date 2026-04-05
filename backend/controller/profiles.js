import * as service from "../service/profiles.js";
import * as CustomError from "../common/CustomError.js";
import {
  createResponse,
  handleCaughtError,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
} from "../common/common.js";
import Role from "../common/Role.js";

export async function get(request, response) {
  try {
    if (!request.valid) throw CustomError.INVALID_REQUEST;

    let result;

    const view = request?.query?.view || "preview";
    const userId = request?.params?.id;
    const isAdmin = request?.user?.role >= Role.ADMIN;

    if (view === "admin") {
      if (!isAdmin) throw CustomError.FORBIDDEN;

      result = await service.getFullProfile({ userId });
    } else {
      result = await service.getProfile({
        userId,
        requesterId: request?.user?.id || null,
        role: request?.user?.role ?? -1,
      });
    }

    response
      .status(200)
      .json(createResponse(true, result, "Profile fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function search(request, response) {
  try {
    if (!request.valid) throw CustomError.INVALID_REQUEST;

    const result = await service.searchFor({
      query: decodeURIComponent(request.query.search),
    });

    response
      .status(200)
      .json(
        createResponse(
          true,
          { profiles: result },
          "Search successfully completed",
        ),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function create(request, response) {
  try {
    const result = await service.createProfile({
      userId: request.targetUser.id,
      role: request.user.role,
      body: request.body,
    });

    response
      .status(200)
      .json(createResponse(true, result, "Profile created successfully"));
  } catch (error) {
    if (isSequelizeUniqueConstraintError(error)) {
      return handleSequelizeUniqueConstraintError(
        response,
        "Profile for this user already exists",
      );
    }
    handleCaughtError(response, error);
  }
}

export async function update(request, response) {
  try {
    if (!request.body) throw CustomError.INVALID_REQUEST;

    await service.updateProfile({
      userId: request.targetUser.id,
      role: request.user.role,
      body: request.body,
    });

    response
      .status(200)
      .json(createResponse(true, null, "Profile updated successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function remove(request, response) {
  try {
    await service.deleteProfile({ userId: request.targetUser.id });

    response
      .status(200)
      .json(createResponse(true, null, "Profile deleted successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
