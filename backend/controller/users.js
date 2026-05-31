/**
 * Kezdobarat magyarazat:
 * Fajl: backend/controller/users.js
 * Szerep: Felhasznalo-vegpontok HTTP-kezelese: kereses, lekeres, regisztracio, frissites es torles.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as service from "../service/users.js";
import {
  createResponse,
  handleCaughtError,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
} from "../common/common.js";
import * as CustomError from "../common/CustomError.js";
import Role from "../common/Role.js";

// A felhasznalo-kereso vegpont HTTP-validaciot es lapozast kezel, majd tovabbadja a service-nek.
export async function search(request, response) {
  try {
    if (!request.valid) throw CustomError.INVALID_REQUEST;

    const result = await service.searchFor({
      query: decodeURIComponent(request.query.search),
      page: Number(request?.query?.page || 1),
      limit: Number(request?.query?.limit || 6),
    });

    console.log(result);

    response
      .status(200)
      .json(createResponse(true, result, "A keresés sikeresen befejeződött"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

// Egy user teljes adatainak lekereset csak sajat maga vagy admin szamara engedi.
export async function get(request, response) {
  try {
    if (!request.valid) throw CustomError.INVALID_REQUEST;

    // Mas felhasznalo adatait csak admin nezheti meg teljes formaban.
    if (
      request.targetUser.id !== request.params.id &&
      request.targetUser.role < Role.ADMIN
    ) {
      throw CustomError.FORBIDDEN;
    }

    const userId = request?.params?.id;

    const result = await service.getUser({ userId });

    response
      .status(200)
      .json(createResponse(true, result, "A felhasználó sikeresen lekérve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

// Regisztracios vegpont: kibontja a body-t, service-t hiv, es kezeli az egyedi kulcs hibakat.
export async function register(request, response) {
  const { username, email, password } = request.body;

  try {
    await service.createUser({
      username,
      email,
      password,
    });

    response
      .status(201)
      .json(createResponse(true, null, "A felhasználó sikeresen létrehozva"));
  } catch (error) {
    if (isSequelizeUniqueConstraintError(error)) {
      return handleSequelizeUniqueConstraintError(
        response,
        "A felhasználónév vagy e-mail cím már foglalt",
      );
    }

    handleCaughtError(response, error);
  }
}

// A sajat vagy celzott user frissitesi kerest adja at a service retegnek.
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
      .json(createResponse(true, null, "A felhasználó sikeresen frissítve"));
  } catch (error) {
    if (isSequelizeUniqueConstraintError(error)) {
      return handleSequelizeUniqueConstraintError(
        response,
        "A felhasználónév vagy e-mail cím már foglalt",
      );
    }
    handleCaughtError(response, error);
  }
}

// A kivalasztott fiokot torli, majd egyszeru sikeres valaszt ad.
export async function remove(request, response) {
  try {
    await service.deleteUser({ id: request.targetUser.id });
    response
      .status(200)
      .json(createResponse(true, null, "A fiók sikeresen törölve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
