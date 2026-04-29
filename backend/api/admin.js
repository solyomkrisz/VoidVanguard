import express from "express";
import Role from "../common/Role.js";
import { authenticate, authorize } from "../common/common.js";

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

export default router;
