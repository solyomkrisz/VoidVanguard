import * as service from "../service/users.js";
import {
  createResponse,
  handleCaughtError,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
} from "../common/common.js";
import * as CustomError from "../common/CustomError.js";

export async function get(request, response) {
  if (!request.valid) throw CustomError.INVALID_REQUEST;

  const userId = request?.params?.id;

  try {
    const result = await service.getUser({ userId });
    response
      .status(200)
      .json(createResponse(true, result, "User fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function register(request, response) {
  const { username, email, gender, password } = request.body;

  try {
    await service.createUser({
      username,
      email,
      gender,
      password,
    });

    response
      .status(201)
      .json(createResponse(true, null, "User created successfully"));
  } catch (error) {
    if (isSequelizeUniqueConstraintError(error)) {
      return handleSequelizeUniqueConstraintError(
        response,
        "Username or email already taken",
      );
    }

    handleCaughtError(response, error);
  }
}

export async function update(request, response) {
  try {
    if (!request.body) throw CustomError.INVALID_REQUEST;

    await service.updateUser({
      userId: request.targetUser.id,
      role: request.user.role,
      body: request.body,
    });

    response
      .status(200)
      .json(createResponse(true, null, "User updated successfully"));
  } catch (error) {
    if (isSequelizeUniqueConstraintError(error)) {
      return handleSequelizeUniqueConstraintError(
        response,
        "Username or email already taken",
      );
    }
    handleCaughtError(response, error);
  }
}

export async function remove(request, response) {
  try {
    await service.deleteUser({ id: request.targetUser.id });
  } catch (error) {
    handleCaughtError(response, error);
  }
}
