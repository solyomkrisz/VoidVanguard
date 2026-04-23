import Scores from "../sql/table/Scores.js";

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
  const currentEntryForGameId = await Scores.select(gameId, userId);

  if (!currentEntryForGameId) {
    return await Scores.insert(gameId, userId, score);
  }

  if (Number(currentEntryForGameId.score) !== Number(score)) {
    return await Scores.update(gameId, userId, score);
  }

  return null;
}
