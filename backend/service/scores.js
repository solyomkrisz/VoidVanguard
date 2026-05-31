/**
 * Kezdobarat magyarazat:
 * Fajl: backend/service/scores.js
 * Szerep: Service reteg: uzleti logika, adatmuveletek, tobb komponens osszefuzese.
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
  const rows = await Scores.selectBestUserScoreWithRank(userId);
  return rows;
}

export async function selectByUserAndGameId({ userId, gameId }) {
  const rows = await Scores.select(gameId, userId);
  return rows;
}

export async function setOrUpdateScoreForGame({ gameId, userId, score }) {
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
