/**
 * Kezdobarat magyarazat:
 * Fajl: backend/controller/friends.js
 * Szerep: Ismeroslista, kapcsolatstatusz es jelolesmuveletek HTTP-valaszainak osszeallitasa.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as service from "../service/friends.js";
import {
  createResponse,
  handleCaughtError,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
} from "../common/common.js";

export async function lazySelectByTarget(request, response) {
  try {
    // A controller a query stringet normalizalja, aztan a service-re bizza a tenyleges baratlista-logikat.
    const statusFilter = request?.query?.status;
    const directionFilter = request?.query?.direction;

    const result = await service.lazySelectByTarget({
      requesterId: request?.targetUser?.id ?? null,
      targetId: request.query.targetId,
      page: Number(request.query?.page || 1),
      limit: Number(request.query?.limit || 20),
      status: statusFilter,
      direction: directionFilter,
    });

    response
      .status(200)
      .json(createResponse(true, result, "Az ismerősök sikeresen lekérve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function summary(request, response) {
  try {
    // A profil widgetek kulonbozo kombinacioban kerhetnek reszadatokat, ezt az include parameter iranyitja.
    const requesterId = request?.targetUser?.id ?? null;
    const userId = request.params.id;
    // Az include egy vesszovel elvalasztott lista a query-ben, pl. preview,status.
    const include = (request.query.include || "").split(",");

    const result = await service.getSummary({ userId, requesterId, include });

    response
      .status(200)
      .json(createResponse(true, result, "Az adatok sikeresen lekérve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function sendFriendRequest(request, response) {
  try {
    // Innen indul az ismerosnek jeloles teljes folyamata a bejelentkezett user neveben.
    await service.sendFriendRequest({
      initiatorId: request.targetUser.id,
      recipientId: request.body.userId,
    });

    response
      .status(200)
      .json(
        createResponse(true, null, "Ismerősnek jelölés sikeresen elküldve"),
      );
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return response
        .status(404)
        .json(createResponse(false, null, "A célfelhasználó nem található"));
    }
    if (isSequelizeUniqueConstraintError(error)) {
      return handleSequelizeUniqueConstraintError(
        response,
        "Már létezik ismerősnek jelölés, vagy már ismerősök vagytok",
      );
    }
    handleCaughtError(response, error);
  }
}

export async function acceptFriendRequest(request, response) {
  try {
    // Az elfogadasnal a request kuldi a masik fel azonositojat, a celfelhasznalo pedig mindig az aktualis user.
    await service.acceptFriendRequest({
      initiatorId: request.body.userId,
      recipientId: request.targetUser.id,
    });

    response
      .status(200)
      .json(
        createResponse(true, null, "Ismerősnek jelölés sikeresen elfogadva"),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function removeFriend(request, response) {
  try {
    // Ugyanez az endpoint takaritja el a kapcsolatot fuggetlenul attol, hogy pending vagy mar elfogadott volt-e.
    await service.deleteFriendship({
      aId: request.targetUser.id,
      bId: request.body.userId,
    });

    response
      .status(200)
      .json(createResponse(true, null, "Ismeretség sikeresen törölve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
