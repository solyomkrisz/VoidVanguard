import express from "express";
import Friends from "../sql/table/Friends.js";
import * as service from "../service/friends.js";
import Blocks from "../sql/table/Blocks.js";
import { checkSchema, validationResult } from "express-validator";
import * as validator from "../validator/friend.js";
import {
  upload,
  createResponse,
  authenticate,
  modifyTargetUser,
  handleExpressValidatorErrors,
  handleCaughtError,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
} from "../common/common.js";

const router = express.Router();

router.get(
  "/",
  authenticate(),
  modifyTargetUser(),
  async (request, response) => {
    try {
      const userId = request.targetUser.id;
      const include = (request.query.include || "").split(",");

      const result = await service.getSummary(userId, include);

      response
        .status(200)
        .json(createResponse(true, result, "Data successfully fetched"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

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
      await service.sendFriendRequest({
        initiatorId: request.targetUser.id,
        recipientId: request.body.userId,
      });

      response
        .status(200)
        .json(createResponse(true, null, "Friend request sent successfully."));
    } catch (error) {
      // if (error.code === "ER_NO_REFERENCED_ROW_2") {
      //   return response
      //     .status(404)
      //     .json(createResponse(false, null, "Target user not found."));
      // }
      // if (isSequelizeUniqueConstraintError(error)) {
      //   return handleSequelizeUniqueConstraintError(
      //     response,
      //     "A friend request already exists or you are already friends with this user.",
      //   );
      // }
      handleCaughtError(response, error);
    }
  },
);

router.patch(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  checkSchema(validator.POST),
  async (request, response) => {
    try {
      await service.acceptFriendRequest({
        initiatorId: request.body.userId,
        recipientId: request.targetUser.id,
      });

      response
        .status(200)
        .json(
          createResponse(true, null, "Friend request accepted successfully"),
        );
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
  async (request, response) => {
    try {
      await service.deleteFriendship({
        aId: request.targetUser.id,
        bId: request.body.userId,
      });

      response
        .status(200)
        .json(createResponse(true, null, "Friendship deleted successfully"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

export default router;
