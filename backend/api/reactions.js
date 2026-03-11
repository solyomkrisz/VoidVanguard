const express = require("express");
const router = express.Router();
const Reactions = require("../sql/table/Reactions.js");
const {
  upload,
  createResponse,
  authenticate,
  handleExpressValidatorErrors,
  handleCaughtError,
  modifyTargetUser,
} = require("../common/common.js");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/reaction.js");

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

module.exports = router;
