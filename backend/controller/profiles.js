/**
 * Kezdobarat magyarazat:
 * Fajl: backend/controller/profiles.js
 * Szerep: Profil-vegpontok HTTP-kezelese, beleertve az admin nezet es a publikus preview elagazast.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as service from "../service/profiles.js";
import * as CustomError from "../common/CustomError.js";
import {
  createResponse,
  handleCaughtError,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
} from "../common/common.js";
import Role from "../common/Role.js";

// A profil lekereso vegpont admin teljes nezetet vagy publikus/szurt previewt ad vissza.
export async function get(request, response) {
  try {
    if (!request.valid) throw CustomError.INVALID_REQUEST;

    let result;

    const view = request?.query?.view || "preview";
    const userId = request?.params?.id;
    const isAdmin = request?.user?.role >= Role.ADMIN;

    // Ugyanaz a vegpont ket nezetet tud: admin teljes adatot, egyebkent csak a szurt profilnezetet.
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
      .json(createResponse(true, result, "A profil sikeresen lekérve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

// A profilkeresot lapozhato HTTP-valassza csomagolja.
export async function search(request, response) {
  try {
    if (!request.valid) throw CustomError.INVALID_REQUEST;

    const page = Number.parseInt(request?.query?.page, 10) || 1;
    const limit = Number.parseInt(request?.query?.limit, 10) || 20;

    const result = await service.searchFor({
      query: decodeURIComponent(request.query.search),
      page,
      limit,
    });

    response
      .status(200)
      .json(createResponse(true, result, "A keresés sikeresen befejeződött"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

// Uj profil letrehozasat inditja el, vagy a service oldali upsert logikat hasznalja.
export async function create(request, response) {
  try {
    const result = await service.createProfile({
      userId: request.targetUser.id,
      role: request.user.role,
      body: request.body,
    });

    response
      .status(200)
      .json(createResponse(true, result, "A profil sikeresen létrehozva"));
  } catch (error) {
    if (isSequelizeUniqueConstraintError(error)) {
      return handleSequelizeUniqueConstraintError(
        response,
        "Ehhez a felhasználóhoz már létezik profil",
      );
    }
    handleCaughtError(response, error);
  }
}

// Meglevo profil frissitesenek HTTP-kezelese.
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
      .json(createResponse(true, null, "A profil sikeresen frissítve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

// Profiltorles vegpont egyszeru service-hivassal es sikeres valasszal.
export async function remove(request, response) {
  try {
    await service.deleteProfile({ userId: request.targetUser.id });

    response
      .status(200)
      .json(createResponse(true, null, "A profil sikeresen törölve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
