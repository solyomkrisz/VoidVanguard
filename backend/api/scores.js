import express from "express";
import {
  createResponse,
  authenticate,
  handleValidation,
  upload,
} from "../common/common.js";
import { checkSchema } from "express-validator";

const router = express.Router();

export default router;
