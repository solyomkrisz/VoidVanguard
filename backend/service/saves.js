import { v4 as uuidv4 } from "uuid";
import * as CustomError from "../common/CustomError.js";
import Saves from "../sql/table/Saves.js";
import Permission from "../common/Permission.js";
import * as scores from "../service/scores.js";

export async function selectUserSave({ gameId, userId }) {
  const result = await Saves.selectByIdForUser(gameId, userId);
  return result;
}

export async function saveOrUpdate({ userId, role, body }) {
  const saveFromDb = await selectUserSave({ gameId: body.game_id, userId });

  if (!saveFromDb) {
    console.log(
      "No existing save found for gameId " +
        body.game_id +
        ", creating new one.",
    );

    return await save({ userId, body });
  }

  return await updateSave({ userId, role, body });
}

export async function save({ userId, body }) {
  const parsedState =
    typeof body.game_state === "string"
      ? JSON.parse(body.game_state)
      : body.game_state;

  let result;

  try {
    result = await Saves.insert({
      gameId: body.game_id,
      userId,
      saveName: body.save_name,
      gameState: JSON.stringify(parsedState),
    });

    // add score
    if (result.affectedRows === 1) {
      await scores.setOrUpdateScoreForGame({
        userId,
        gameId: body.game_id,
        score: parsedState.player.score,
      });
    }
  } catch (error) {
    if (
      error.code === "ER_DUP_ENTRY" &&
      error.sqlMessage.includes("unique_user_save_name")
    ) {
      throw CustomError.DUPLICATE_SAVE_STATE;
    }
    throw error;
  }

  if (result.affectedRows < 1) {
    throw CustomError.SAVE_ERROR;
  }

  return result;
}

export async function updateSave({ userId, role, body }) {
  const gameId = body.game_id;

  const saveFromDb = await selectUserSave({ gameId, userId });
  if (!save) throw CustomError.TEST;

  const updates = {};

  // save_name and game_state can be in the body
  for (const column in body) {
    if (
      !Saves.hasPermission(column, role, Permission.W) ||
      !Saves.columnExists(column)
    ) {
      continue;
    }

    if (body[column] === saveFromDb[column]) {
      continue;
    }

    updates[column] = body[column];
  }

  const changedColumns = Object.keys(updates);
  const parsedState =
    typeof body.game_state === "string"
      ? JSON.parse(body.game_state)
      : body.game_state;

  if (!changedColumns.length) {
    // megnézzük van e score hozzá és ha nincs függetlenül mindentől berakjuk azt
    const associatedScore = await scores.selectByUserAndGameId({
      userId,
      gameId,
    });

    if (!associatedScore) {
      await scores.setOrUpdateScoreForGame({
        userId,
        gameId,
        score: parsedState.player.score,
      });
    }

    throw CustomError.NO_DATA_CHANGE;
  }

  let result;

  try {
    result = await Saves.update(userId, gameId, updates);

    // update score
    if (result.affectedRows === 1) {
      await scores.setOrUpdateScoreForGame({
        userId,
        gameId,
        score: parsedState.player.score,
      });
    }
  } catch (error) {
    if (
      error.code === "ER_DUP_ENTRY" &&
      error.sqlMessage.includes("unique_user_save_name")
    ) {
      throw CustomError.DUPLICATE_SAVE_STATE;
    }
    throw error;
  }

  if (!result) {
    throw CustomError.TEST;
  }

  return result;
}

export async function lazySelectByUserId({ userId, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;

  const saves = await Saves.lazySelectByUserId(userId, { limit, offset });
  const total = await Saves.countSavesForUserId(userId);

  return {
    saves,
    page,
    limit,
    total,
    hasNext: offset + saves.length < total,
  };
}

export async function deleteSave({ gameId, userId }) {
  if ((await Saves.delete(userId, gameId)).affectedRows === 0) {
    throw CustomError.TEST;
  }
  return null;
}
