import express from "express";
import Comments from "../sql/table/Comments.js";
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
import * as CustomError from "../common/CustomError.js";

const router = express.Router();

router.get("/", checkSchema(validator.GET), async (request, response) => {
  const errors = validationResult(request);

  if (!errors.isEmpty()) return handleExpressValidatorErrors(response, errors);

  try {
    const result = await Comments.lazySelectByTarget(request);

    response
      .status(200)
      .json(createResponse(true, result, "Comments fetched successfully"));
  } catch (error) {
    handleCaughtError(response, error);
  }
});

router.get("/:id", async (request, response) => {
  try {
    const result = await Comments.select(request);

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
      request.body.authorId = request.targetUser.id;

      await Comments.create(request);

      response
        .status(200)
        .json(createResponse(true, null, "Comment posted successfully"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  }
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
      if ((await Comments.update(request)).affectedRows === 0)
        throw CustomError.TEST;

      response
        .status(200)
        .json(createResponse(true, null, "Comment successfully updated"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  }
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
      if ((await Comments.delete(request)).affectedRows === 0)
        throw CustomError.TEST;

      response
        .status(200)
        .json(createResponse(true, null, "Comment successfully deleted"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  }
);

export default router;
