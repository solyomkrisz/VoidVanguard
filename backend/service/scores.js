/**
 * Kezdobarat magyarazat:
 * Fajl: backend/service/scores.js
 * Szerep: Pontszamlista-lekerdezes es menteshez kotott score-frissites uzleti logikaja.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Scores from "../sql/table/Scores.js";
import Saves from "../sql/table/Saves.js";
import * as CustomError from "../common/CustomError.js";

export async function lazySelectBestUserScores({
  userId = null,
  view = "public",
  page = 1,
  limit = 20,
}) {
  // Ugyanaz a vegpont ket nezetet tud kiszolgalni: publikus toplistat vagy a sajat privat eredmenylistat.
  const offset = (page - 1) * limit;

  let scores, total;

  if (view === "public") {
    scores = await Scores.lazySelectBestUserScoresWithoutRankPublic({
      limit,
      offset,
    });
    total = await Scores.getTotalBestScoresPublic();
  } else if (view === "private" && userId) {
    scores = await Scores.lazySelectBestUserScoresWithoutRankPrivate(userId, {
      limit,
      offset,
    });
    total = await Scores.getTotalBestScoresPrivate(userId);
  } else {
    scores = [];
    total = 0;
  }

  return {
    scores,
    page,
    limit,
    total,
    hasNext: offset + scores.length < total,
  };
}

export async function getBestScoreWithRankForUser({ userId }) {
  // Ez a lekerdezes a nyers pontszam melle a helyezest is visszaadja.
  const rows = await Scores.selectBestUserScoreWithRank(userId);
  return rows;
}

export async function selectByUserAndGameId({ userId, gameId }) {
  // Akkor hasznos, amikor egy konkret menteshez tartozó score-t kell visszakeresni.
  const rows = await Scores.select(gameId, userId);
  return rows;
}

export async function setOrUpdateScoreForGame({ gameId, userId, score }) {
  // Score-t csak a mentes tulajdonosa allithat be, es csak akkor irunk adatbazisba, ha tenyleg valtozott az ertek.
  // ownership check
  const save = await Saves.selectByIdForUser(gameId, userId);

  if (!save) {
    throw CustomError.FORBIDDEN;
  }

  const currentEntryForGameId = await Scores.select(gameId);

  if (!currentEntryForGameId) {
    return await Scores.insert(gameId, score);
  }

  if (Number(currentEntryForGameId.score) !== Number(score ?? 0)) {
    return await Scores.update(gameId, score);
  }

  return null;
}
