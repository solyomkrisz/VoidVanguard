import express from "express";
import * as controller from "../controller/saves.js";
import {
  createResponse,
  authenticate,
  handleValidation,
  upload,
} from "../common/common.js";
import { checkSchema } from "express-validator";
import * as validator from "../validator/save.js";

const router = express.Router();

router.get("/", authenticate(), controller.lazySelectByUserId);

router.get("/:id", authenticate(), validator.GET, controller.selectSave);

router.patch(
  "/",
  authenticate(),
  upload.none(),
  checkSchema(validator.PATCH),
  handleValidation,
  controller.patchSave
);

router.put(
  "/",
  authenticate(),
  upload.none(),
  checkSchema(validator.PUT),
  handleValidation,
  controller.saveOrUpdate
);

router.delete(
  "/",
  authenticate(),
  upload.none(),
  checkSchema(validator.DELETE),
  handleValidation,
  controller.deleteSave
);

export default router;
