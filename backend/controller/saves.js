import * as service from "../service/saves.js";
import { createResponse, handleCaughtError } from "../common/common.js";

export async function selectSave(request, response) {}

export async function saveGame(request, response) {
  try {
    const saveId = await service.save({
      userId: request.targetUser.id,
      slotName: request.body.slotName,
      gameState: request.body.gameState,
    });

    response
      .status(200)
      .json(createResponse(true, saveId, "Game successfully saved"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
