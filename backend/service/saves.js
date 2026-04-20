import { v4 as uuidv4 } from "uuid";
import * as CustomError from "../common/CustomError.js";
import Saves from "../sql/table/Saves.js";
import Permission from "../common/Permission.js";
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

export async function save({ userId, slotName, gameState, saveId = null }) {
  const id = saveId ?? uuidv4();

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

  const saveFromDb = await selectUserSave({ saveId, userId });
  // if (!save) throw CustomError.TEST;

  if (!saveFromDb) {
    console.log("PATCH de nincs ilyen " + saveId + "save id-vel mentés.");

    const slotName = body.slot_name;
    const gameState = body.game_state;

    if (!slotName || !gameState) {
      throw CustomError.TEST;
    }

    return await save({ userId, slotName, gameState, saveId });
  }

  const updates = {};

  // slot_name and game_state can be in the body
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

  if (!changedColumns.length) {
    throw CustomError.NO_DATA_CHANGE;
  }

  if (updates.game_state) {
    const parsedState =
      typeof updates.game_state === "string"
        ? JSON.parse(updates.game_state)
        : updates.game_state;

    const newStateHash = hashGameState(parsedState);

    // Ha csak a játékállást módosítjuk és a hashe ugyan az mint az előző mentésé
    if (changedColumns.length === 1 && changedColumns.includes("game_state")) {
      if (saveFromDb["state_hash"] === newStateHash) {
        throw CustomError.NO_DATA_CHANGE;
      }
    }

    updates["state_hash"] = newStateHash;
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
