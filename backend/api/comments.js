import express from "express";
import * as service from "../service/comments.js";
import {
  createResponse,
  authenticate,
  handleExpressValidatorErrors,
  handleCaughtError,
  modifyTargetUser,
  upload,
} from "../common/common.js";
import { checkSchema, validationResult } from "express-validator";
import * as validator from "../validator/comment.js";

const router = express.Router();

router.get("/", checkSchema(validator.GET), async (request, response) => {
  const errors = validationResult(request);

  if (!errors.isEmpty()) return handleExpressValidatorErrors(response, errors);

  try {
    const result = await service.lazySelectByTarget({
      targetId: request.query.targetId,
      page: request.query.page,
      limit: request.query.limit,
    });

    response
      .status(200)
      .json(createResponse(true, result, "Comments fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
});

router.get("/:id", async (request, response) => {
  try {
    const result = await service.select(request.params.id);

    response
      .status(200)
      .json(createResponse(true, result, "Comment fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
});

router.post(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.POST),
  async (request, response) => {
    const errors = validationResult(request);

    if (!errors.isEmpty())
      return handleExpressValidatorErrors(response, errors);

    try {
      await service.createComment({
        authorId: request.targetUser.id,
        targetId: request.body.targetId,
        parentId: request.body.parentId,
        content: request.body.content,
      });

      response
        .status(200)
        .json(createResponse(true, null, "Comment posted successfully"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

router.patch(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.PATCH),
  async (request, response) => {
    const errors = validationResult(request);

    if (!errors.isEmpty())
      return handleExpressValidatorErrors(response, errors);

    try {
      await service.updateComment({
        userId: request.targetUser.id,
        commentId: request.body.commentId,
        content: request.body.content,
      });

      response
        .status(200)
        .json(createResponse(true, null, "Comment successfully updated"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

router.delete(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.DELETE),
  async (request, response) => {
    const errors = validationResult(request);

    if (!errors.isEmpty())
      return handleExpressValidatorErrors(response, errors);

    try {
      await service.deleteComment({
        userId: request.targetUser.id,
        commentId: request.body.commentId,
      });

      response
        .status(200)
        .json(createResponse(true, null, "Comment successfully deleted"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

export default router;
