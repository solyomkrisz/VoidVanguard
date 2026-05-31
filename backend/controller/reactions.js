/**
 * Kezdobarat magyarazat:
 * Fajl: backend/controller/reactions.js
 * Szerep: Controller reteg: bejovo keres feldolgozasa, service meghivasa, valasz osszeallitasa.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as service from "../service/reactions.js";
import { createResponse, handleCaughtError } from "../common/common.js";

export async function get(request, response) {
  try {
    const result = await service.getUserReaction({
      userId: request.targetUser.id,
      targetId: request.params.targetId,
    });

    response.status(200).json(createResponse(true, result, "Reakció lekérve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function create(request, response) {
  try {
    const result = await service.createUserReaction({
      userId: request.targetUser.id,
      targetId: request.body.targetId,
      reactionType: request.body.type,
    });

    response
      .status(200)
      .json(createResponse(true, result, "Reakció hozzáadva vagy frissítve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
