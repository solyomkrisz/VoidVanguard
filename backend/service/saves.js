import { v4 as uuidv4 } from "uuid";
import * as CustomError from "../common/CustomError.js";
import Saves from "../sql/table/Saves.js";
import crypto from "crypto";
import stableStringify from "fast-json-stable-stringify";

function hashGameState(state) {
  const normalized = {
    ...state,
    // enemies: [...state.enemies].sort((a, b) => a.id - b.id),
  };
  const canonical = stableStringify(normalized);
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export async function selectUserSave({ saveId, userId }) {
  const result = await Saves.selectByIdForUser(saveId, userId);
  return result;
}

export async function save({ userId, slotName, gameState }) {
  const id = uuidv4();

  const parsedState =
    typeof gameState === "string" ? JSON.parse(gameState) : gameState;

  const result = await Saves.insert({
    id,
    userId,
    slotName,
    gameState: JSON.stringify(parsedState),
    stateHash: hashGameState(parsedState),
  });

  if (result.affectedRows < 1) {
    throw CustomError.SAVE_ERROR;
  }

  return id;
}

export async function updateSave({ userId, role, body }) {
  const saveId = body.save_id;
  if (!saveId) throw CustomError.INVALID_REQUEST;

  const save = await selectUserSave(saveId, userId);
  const updates = {};

  // slot_name and game_state can be in the body
  for (const column in body) {
    if (
      !Saves.hasPermission(column, role, Permission.W) ||
      !Saves.columnExists(column)
    ) {
      continue;
    }

    if (body[column] === save[column]) {
      continue;
    }

    updates[column] = body[column];
  }

  if (!Object.keys(updates).length) {
    throw CustomError.NO_DATA_CHANGE;
  }

  const result = await Saves.update(userId, saveId, updates);

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

export async function deleteSave({ saveId, userId }) {
  if ((await Saves.delete(userId, saveId)).affectedRows === 0) {
    throw CustomError.TEST;
  }
  return null;
}
