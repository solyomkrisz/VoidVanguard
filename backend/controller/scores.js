/**
 * Kezdobarat magyarazat:
 * Fajl: backend/controller/scores.js
 * Szerep: Pontszamlistak es sajat helyezes HTTP-vegpontjainak vezerlese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as service from "../service/scores.js";
import { createResponse, handleCaughtError } from "../common/common.js";
import * as CustomError from "../common/CustomError.js";

export async function lazySelectBestUserScores(request, response) {
  try {
    // A privat nezettol csak hitelesitett user kerhet adatot, a publikus toplista viszont barkinek mehet.
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
    // Itt mindig a sajat user id-javal kerunk helyezest, nem tetszoleges query parameterrel.
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
