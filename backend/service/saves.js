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
