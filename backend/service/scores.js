import Scores from "../sql/table/Scores.js";

export async function lazySelectBestUserScores({ page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;

  const scores = await Scores.lazySelectBestUserScoreWithoutRank({
    limit,
    offset,
  });

  console.log(scores);

  const total = await Scores.getTotalBestScores();

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
