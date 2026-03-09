const express = require("express");
const router = express.Router();
const Reactions = require("../sql/table/Reactions.js");
const {
  createResponse,
  authenticate,
  handleExpressValidatorErrors,
  handleCaughtError,
  modifyTargetUser,
} = require("../common/common.js");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/comment.js");

// prettier-ignore
router.post(
  "/",
  authenticate(),
  modifyTargetUser(),
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
