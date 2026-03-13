import * as service from "../service/users.js";
import {
  createResponse,
  handleCaughtError,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
} from "../common/common.js";
import * as CustomError from "../common/CustomError.js";

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
      role: request.targetUser.role,
      body: request.body,
    });
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
