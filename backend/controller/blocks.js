/**
 * Kezdobarat magyarazat:
 * Fajl: backend/controller/blocks.js
 * Szerep: Tiltasi lista, blokkstatusz es block/unblock valaszok HTTP-szintu vezerlese.
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
    // A controller itt egyszerre ellenorzi a jogosultsagot es alakítja at a lapozasi parametereket.
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
    // A frontend profilkartyaja innen kapja meg a kert tiltasi osszegzest a tobbi statusz melle.
    const requesterId = request.targetUser.id;
    const userId = request.params.id;
    // Az include query teszi lehetove, hogy a kliens csak a szukseges reszstatuszokat kerje le.
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
    // Ez az endpoint a bejelentkezett felhasznalo sajat tiltott listajat adja vissza.
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
    // A request body-bol jon a letiltando user, de a blokkolast mindig az aktualis targetUser neveben hajtjuk vegre.
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
    // A feloldas ugyanazt az azonositasi mintat koveti, mint a tiltasi muvelet, csak torlesi iranyban.
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
