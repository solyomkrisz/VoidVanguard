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

router.get("/:id", authenticate(), validator.GET, controller.selectSave);

router.post(
  "/",
  authenticate(),
  upload.none(),
  checkSchema(validator.POST),
  controller.saveGame,
);

export default router;
