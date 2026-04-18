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
      slotName: request.body.slot_name,
      gameState: request.body.game_state,
    });

    response
      .status(200)
      .json(createResponse(true, saveId, "Game successfully saved"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function updateSave(request, response) {
  try {
    const result = await service.updateSave({
      userId: request.targetUser.id,
      role: request.targetUser.role ?? -1,
      body: request.body,
    });

    response
      .status(200)
      .json(createResponse(true, null, "Save successfully updated"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function deleteSave(request, response) {
  try {
    const result = await service.deleteSave({
      saveId: request.body.saveId,
      userId: request.targetUser.id,
    });

    response
      .status(200)
      .json(createResponse(true, null, "Save successfully deleted"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
