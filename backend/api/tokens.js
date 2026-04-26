import express from "express";
import * as controller from "../controller/tokens.js";

const router = express.Router();

router.get("/", controller.refresh);

router.delete("/", controller.revokeSession);

export default router;
