import * as service from "../service/scores.js";
import { createResponse, handleCaughtError } from "../common/common.js";
import * as CustomError from "../common/CustomError.js";

export async function lazySelectBestUserScores(request, response) {
  try {
    const result = await service.lazySelectBestUserScores({
      page: Number(request.query?.page || 1),
      limit: Number(request.query?.limit || 20),
    });

    response
      .status(200)
      .json(createResponse(true, result, "Scores fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function getBestScoreWithRankForUser(request, response) {
  try {
    const result = await service.getBestScoreWithRankForUser({
      userId: request.user.id,
    });

    response.json(createResponse(true, result, "Score fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
