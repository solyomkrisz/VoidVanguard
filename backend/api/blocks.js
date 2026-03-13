import express from "express";
import * as service from "../service/blocks.js";
import * as validator from "../validator/block.js";
import {
  upload,
  createResponse,
  authenticate,
  modifyTargetUser,
  handleCaughtError,
  handleSequelizeUniqueConstraintError,
  isSequelizeUniqueConstraintError,
} from "../common/common.js";

const router = express.Router();

router.get(
  "/",
  authenticate(),
  modifyTargetUser(),
  validator.POST,
  async (request, response) => {
    if (!request.valid) {
      return response
        .status(400)
        .json(createResponse(false, null, "Invalid user ID"));
    }

    try {
      const result = await service.getBlockedUsers({
        blockerId: request.targetUser.id,
      });

      response
        .status(200)
        .json(
          createResponse(true, result, "Blocked users retrieved successfully"),
        );
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
  validator.POST,
  async (request, response) => {
    if (!request.valid) {
      return response
        .status(400)
        .json(createResponse(false, null, "Invalid user ID"));
    }

    try {
      await service.blockUser({
        blockerId: request.targetUser.id,
        blockedId: request.body.userId,
      });

      response
        .status(201)
        .json(createResponse(true, null, "User blocked successfully"));
    } catch (error) {
      if (isSequelizeUniqueConstraintError(error)) {
        return handleSequelizeUniqueConstraintError(
          response,
          "This user has already been blocked",
        );
      }
      handleCaughtError(response, error);
    }
  },
);

router.delete(
  "/",
  authenticate(),
  modifyTargetUser(),
  upload.none(),
  validator.POST,
  async (request, response) => {
    if (!request.valid) {
      return response
        .status(400)
        .json(createResponse(false, null, "Invalid user ID"));
    }

    try {
      await service.unblockUser({
        blockerId: request.targetUser.id,
        blockedId: request.body.userId,
      });

      response
        .status(200)
        .json(createResponse(true, null, "User unblocked successfully"));
    } catch (error) {
      handleCaughtError(response, error);
    }
  },
);

export default router;
