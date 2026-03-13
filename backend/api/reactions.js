import express from "express";
import * as service from "../service/reactions.js";
import {
  upload,
  createResponse,
  authenticate,
  handleExpressValidatorErrors,
  handleCaughtError,
  modifyTargetUser,
} from "../common/common.js";
import { checkSchema, validationResult } from "express-validator";
import * as validator from "../validator/reaction.js";

const router = express.Router();

router.get(
  "/:targetId",
  authenticate(),
  modifyTargetUser(),
  checkSchema(validator.GET),
  async (request, response) => {
    const errors = validationResult(request);

    if (!errors.isEmpty())
      return handleExpressValidatorErrors(response, errors);

    try {
      const result = await service.getUserReaction({
        userId: request.targetUser.id,
        targetId: request.body.targetId,
      });

      response
        .status(200)
        .json(createResponse(true, result, "Reaction fetched"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

// prettier-ignore
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
      const result = await service.createUserReaction({
        userId: request.targetUser.id,
        targetId: request.body.targetId,
        reactionType: request.body.reactionType
      });

      response
        .status(200)
        .json(createResponse(true, result, "Reaction added or updated"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

export default router;
