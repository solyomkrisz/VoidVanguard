/**
 * Kezdobarat magyarazat:
 * Fajl: backend/controller/blocks.js
 * Szerep: Controller reteg: bejovo keres feldolgozasa, service meghivasa, valasz osszeallitasa.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as service from "../service/blocks.js";
import {
  createResponse,
  handleCaughtError,
  handleSequelizeUniqueConstraintError,
  isSequelizeUniqueConstraintError,
} from "../common/common.js";
import Role from "../common/Role.js";
import * as CustomError from "../common/CustomError.js";

export async function lazySelectByTarget(request, response) {
  if (!request.valid) {
    return response
      .status(400)
      .json(createResponse(false, null, "Érvénytelen felhasználóazonosító"));
  }

  try {
    const targetId = request.query.targetId;

    if (targetId !== request.user.id && request.user.role < Role.ADMIN) {
      throw CustomError.FORBIDDEN;
    }

    const result = await service.lazySelectByTarget({
      targetId,
      page: Number(request.query?.page || 1),
      limit: Number(request.query?.limit || 20),
    });

    console.log(result);

    response
      .status(200)
      .json(
        createResponse(
          true,
          result,
          "A letiltott felhasználók sikeresen lekérve",
        ),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function summary(request, response) {
  try {
    const requesterId = request.targetUser.id;
    const userId = request.params.id;
    const include = (request.query.include || "").split(",");

    const result = await service.getSummary({ userId, requesterId, include });

    response
      .status(200)
      .json(createResponse(true, result, "Az adatok sikeresen lekérve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function getBlockedUsers(request, response) {
  if (!request.valid) {
    return response
      .status(400)
      .json(createResponse(false, null, "Érvénytelen felhasználóazonosító"));
  }

  try {
    const result = await service.getBlockedUsers({
      blockerId: request.targetUser.id,
    });

    response
      .status(200)
      .json(
        createResponse(
          true,
          result,
          "A letiltott felhasználók sikeresen lekérve",
        ),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function blockUser(request, response) {
  if (!request.valid) {
    return response
      .status(400)
      .json(createResponse(false, null, "Érvénytelen felhasználóazonosító"));
  }

  try {
    await service.blockUser({
      blockerId: request.targetUser.id,
      blockedId: request.body.userId,
    });

    response
      .status(201)
      .json(createResponse(true, null, "A felhasználó sikeresen letiltva"));
  } catch (error) {
    if (isSequelizeUniqueConstraintError(error)) {
      return handleSequelizeUniqueConstraintError(
        response,
        "Ez a felhasználó már le van tiltva",
      );
    }
    handleCaughtError(response, error);
  }
}

export async function unblockUser(request, response) {
  if (!request.valid) {
    return response
      .status(400)
      .json(createResponse(false, null, "Érvénytelen felhasználóazonosító"));
  }

  try {
    await service.unblockUser({
      blockerId: request.targetUser.id,
      blockedId: request.body.userId,
    });

    response
      .status(200)
      .json(
        createResponse(true, null, "A felhasználó tiltása sikeresen feloldva"),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}
