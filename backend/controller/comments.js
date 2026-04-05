import * as service from "../service/comments.js";
import { createResponse, handleCaughtError } from "../common/common.js";

export async function lazySelectComments(request, response) {
  try {
    const result = await service.lazySelectByTarget({
      requesterId: request?.targetUser?.id ?? null,
      targetId: request.query.targetId,
      page: Number(request.query?.page || 1),
      limit: Number(request.query?.limit || 20),
    });

    response
      .status(200)
      .json(createResponse(true, result, "Comments fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function getComment(request, response) {
  try {
    const result = await service.select({
      requesterId: request?.targetUser?.id ?? null,
      commentId: request.params.id,
    });

    response
      .status(200)
      .json(createResponse(true, result, "Comment fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function createComment(request, response) {
  try {
    const commentId = await service.createComment({
      authorId: request.targetUser.id,
      targetId: request.body.targetId,
      parentId: request.body.parentId,
      content: request.body.content,
    });

    const comment = await service.select({ commentId });

    response
      .status(200)
      .json(createResponse(true, comment, "Comment posted successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function updateComment(request, response) {
  try {
    await service.updateComment({
      userId: request.targetUser.id,
      commentId: request.body.commentId,
      content: request.body.content,
    });

    const updatedComment = await service.select({
      commentId: request.body.commentId,
    });

    response
      .status(200)
      .json(
        createResponse(true, updatedComment, "Comment successfully updated"),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function deleteComment(request, response) {
  try {
    await service.deleteComment({
      userId: request.targetUser.id,
      role: request.user.role,
      commentId: request.body.commentId,
    });

    response
      .status(200)
      .json(createResponse(true, null, "Comment successfully deleted"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
