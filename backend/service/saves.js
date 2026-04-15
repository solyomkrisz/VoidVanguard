import { v4 as uuidv4 } from "uuid";
import * as CustomError from "../common/CustomError.js";
import Saves from "../sql/table/Saves.js";

export async function save({ userId, slotName, gameState }) {
  const id = uuidv4();

  const result = await Saves.insert({
    id,
    userId,
    slotName,
    gameState,
  });

  if (result.affectedRows < 1) {
    throw CustomError.SAVE_ERROR;
  }

  return id;
}
