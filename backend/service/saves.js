/**
 * Kezdobarat magyarazat:
 * Fajl: backend/service/saves.js
 * Szerep: Jatekmentesek adatbazisos uzleti logikaja, score-szinkronnal es allapotellenorzessel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { v4 as uuidv4 } from "uuid";
import * as CustomError from "../common/CustomError.js";
import Saves from "../sql/table/Saves.js";
import Permission from "../common/Permission.js";
import * as scores from "../service/scores.js";

// Egy konkret mentest ker le a sajat tulajdonos szempontjabol.
export async function selectUserSave({ gameId, userId }) {
  const result = await Saves.selectByIdForUser(gameId, userId);
  return result;
}

// Eldonti, hogy uj mentest kell letrehozni, vagy a meglevo rekordot kell frissiteni.
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

// Uj jatekmentest hoz letre, es a leaderboard score-ral is szinkronba hozza.
export async function save({ userId, body }) {
  const parsedState =
    typeof body.game_state === "string"
      ? JSON.parse(body.game_state)
      : body.game_state;

  let result;

  try {
    // A játékállapotot mindig egységesen JSON-ként mentjük, akkor is, ha a body-ban már objektumként érkezett.
    result = await Saves.insert({
      gameId: body.game_id,
      userId,
      saveName: body.save_name,
      gameState: JSON.stringify(parsedState),
    });

    // add score
    if (result.affectedRows === 1) {
      // Mentéskor a leaderboardhoz tartozó score-t is szinkronban tartjuk.
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

// Egy mar letezo mentest frissit jogosultsag- es valtozasellenorzessel.
export async function updateSave({ userId, role, body }) {
  const gameId = body.game_id;

  const saveFromDb = await selectUserSave({ gameId, userId });
  if (!saveFromDb) throw CustomError.SAVE_NOT_FOUND;

  if (saveFromDb.is_finished) {
    throw CustomError.GAME_IS_FINISHED;
  }

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
    // Akkor is ellenőrizzük a score-t, ha maga a mentés nem változott, mert korábban hiányozhatott a kapcsolódó rekord.
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
      // A score itt is újraszámolódik, hogy a mentett állapot és a pontszám ne csússzon szét.
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

// Lapozhato formatumban adja vissza a user sajat menteseit.
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

// Torol egy sajat mentest a jatek azonositoja alapjan.
export async function deleteSave({ gameId, userId }) {
  if ((await Saves.delete(userId, gameId)).affectedRows === 0) {
    throw CustomError.TEST;
  }
  return null;
}
