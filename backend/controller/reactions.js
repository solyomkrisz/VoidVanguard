import * as service from "../service/reactions.js";
import { createResponse, handleCaughtError } from "../common/common.js";

export async function get(request, response) {
  try {
    const result = await service.getUserReaction({
      userId: request.targetUser.id,
      targetId: request.params.targetId,
    });

    response.status(200).json(createResponse(true, result, "Reaction fetched"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function create(request, response) {
  try {
    const result = await service.createUserReaction({
      userId: request.targetUser.id,
      targetId: request.body.targetId,
      reactionType: request.body.type,
    });

    response
      .status(200)
      .json(createResponse(true, result, "Reaction added or updated"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
