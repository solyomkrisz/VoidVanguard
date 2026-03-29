import express from "express";
import Role from "../common/Role.js";
import { authenticate, authorize } from "../common/common.js";

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get(
  "/",
  authenticate({
    onValidAccessToken: (request, _1, next) => next(),
    onInvalidAccessToken: (request, response, _1) => {
      response.sendFile(
        path.join(__dirname, "../../frontend/ui/html/error.html"),
      );
    },
  }),
  authorize(Role.ADMIN, {
    onMatch: (_, _1, next) => next(),
    onMismatch: (_, response, _1) => {
      response.sendFile(
        path.join(__dirname, "../../frontend/ui/html/error.html"),
      );
    },
  }),
  (request, response) => {
    response.sendFile(
      path.join(__dirname, "../../protected/ui/html/admin.html"),
    );
  },
);

export default router;
