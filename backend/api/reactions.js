import express from "express";
import Reactions from "../sql/table/Reactions.js";
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
      const result = await Reactions.select(request);

      response
        .status(200)
        .json(createResponse(true, result, "Reaction fetched"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  }
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
      const reaction_type = request.body.reactionType;

      if ((await Reactions.delete(request)).affectedRows > 0) {
        return response
          .status(200)
          .json(createResponse(true, { reaction_type }, "Reaction successfully deleted"));
      }

      await Reactions.upsert(request);

      response
        .status(200)
        .json(createResponse(true, { reaction_type }, "Reaction added or updated"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

export default router;
