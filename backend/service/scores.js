import Scores from "../sql/table/Scores.js";

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
