import * as service from "../service/scores.js";
import { createResponse, handleCaughtError } from "../common/common.js";
import * as CustomError from "../common/CustomError.js";

export async function lazySelectBestUserScores(request, response) {
  try {
    const view = request?.query?.view || "public";

    if (view !== "public" && !request?.targetUser?.id) {
      throw CustomError.UNAUTHORIZED;
    }

    const result = await service.lazySelectBestUserScores({
      userId: request?.targetUser?.id,
      view,
      page: Number(request.query?.page || 1),
      limit: Number(request.query?.limit || 20),
    });

    response
      .status(200)
      .json(createResponse(true, result, "Az eredmények sikeresen lekérve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function getBestScoreWithRankForUser(request, response) {
  try {
    const result = await service.getBestScoreWithRankForUser({
      userId: request.user.id,
    });

    response.json(
      createResponse(true, result, "Az eredmény sikeresen lekérve"),
    );
  } catch (error) {
    handleCaughtError(response, error);
  }
}
