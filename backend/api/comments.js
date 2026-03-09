const express = require("express");
const router = express.Router();
const Comments = require("../sql/table/Comments.js");
const {
  createResponse,
  authenticate,
  handleExpressValidatorErrors,
  handleCaughtError,
  modifyTargetUser,
  upload,
} = require("../common/common.js");
const { checkSchema, validationResult } = require("express-validator");
const validator = require("../validator/comment.js");
const CustomError = require("../common/CustomError.js");

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
      if ((await Comments.update(request)).affectedRows === 0)
        throw CustomError.TEST;

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
      if ((await Comments.delete(request)).affectedRows === 0)
        throw CustomError.TEST;

      response
        .status(200)
        .json(createResponse(true, null, "Comment successfully deleted"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

module.exports = router;
