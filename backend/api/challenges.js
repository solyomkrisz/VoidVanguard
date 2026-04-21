import express from "express";
import * as controller from "../controller/challenges.js";
import * as validator from "../validator/challenge.js";
import { upload, authenticate, modifyTargetUser } from "../common/common.js";

const router = express.Router();

export default router;
