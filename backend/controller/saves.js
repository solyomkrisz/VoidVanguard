import * as service from "../service/saves.js";
import { createResponse, handleCaughtError } from "../common/common.js";
import * as CustomError from "../common/CustomError.js";

export async function lazySelectByUserId(request, response) {
  try {
    const result = await service.lazySelectByUserId({
      userId: request.targetUser.id,
      page: Number(request.query?.page || 1),
      limit: Number(request.query?.limit || 20),
    });

    response
      .status(200)
      .json(createResponse(true, result, "Saves fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function selectSave(request, response) {
  try {
    if (!request.valid) {
      throw CustomError.INVALID_REQUEST;
    }

    const save = await service.selectUserSave({
      saveId: request.params.id,
      userId: request.targetUser.id,
    });

    response
      .status(200)
      .json(createResponse(true, save, "Save successfully fetched"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

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
