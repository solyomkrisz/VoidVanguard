/**
 * Kezdobarat magyarazat:
 * Fajl: backend/controller/saves.js
 * Szerep: Jatekmentesek listazasat, lekereset, menteset, frissiteset es torleset kezelo HTTP-reteg.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as service from "../service/saves.js";
import { createResponse, handleCaughtError } from "../common/common.js";
import * as CustomError from "../common/CustomError.js";

// A user sajat menteseit lapozhato HTTP-valassza csomagolja.
export async function lazySelectByUserId(request, response) {
  try {
    const result = await service.lazySelectByUserId({
      userId: request.targetUser.id,
      page: Number(request.query?.page || 1),
      limit: Number(request.query?.limit || 20),
    });

    response
      .status(200)
      .json(createResponse(true, result, "A mentések sikeresen lekérve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

// Egy konkret mentest ker le a requestben kapott jatekazonosito alapjan.
export async function selectSave(request, response) {
  try {
    if (!request.valid) {
      throw CustomError.INVALID_REQUEST;
    }

    const save = await service.selectUserSave({
      gameId: request.params.id,
      userId: request.targetUser.id,
    });

    response
      .status(200)
      .json(createResponse(true, save, "A mentés sikeresen lekérve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

// Patch kéréssel csak mentesfrissitest vegez a service retegen keresztul.
export async function patchSave(request, response) {
  try {
    const result = await service.updateSave({
      userId: request.targetUser.id,
      role: request.targetUser.role ?? -1,
      body: request.body,
    });

    response
      .status(200)
      .json(createResponse(true, result, "A mentés sikeresen frissítve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

// Uj mentest hoz letre vagy a meglevo rekordot frissiti ugyanazon a vegponton.
export async function saveOrUpdate(request, response) {
  try {
    const gameId = await service.saveOrUpdate({
      userId: request.targetUser.id,
      role: request.targetUser.role ?? -1,
      body: request.body,
    });

    response
      .status(200)
      .json(createResponse(true, gameId, "A játék sikeresen elmentve"));
  } catch (error) {
    if (
      error.code === "ER_DUP_ENTRY" &&
      error.sqlMessage.includes("unique_user_slot")
    ) {
      // Itt kulon emberi uzenetet adunk a DB-hibara, mert a nyers SQL hiba nem lenne ertheto a kliensnek.
      return handleSequelizeUniqueConstraintError(
        response,
        "A mentés ehhez a játékazonosítóhoz már létezik",
      );
    }
    handleCaughtError(response, error);
  }
}

// Torli a megadott game_id-hoz tartozo sajat mentest.
export async function deleteSave(request, response) {
  try {
    const result = await service.deleteSave({
      gameId: request.body.game_id,
      userId: request.targetUser.id,
    });

    response
      .status(200)
      .json(createResponse(true, null, "A mentés sikeresen törölve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
