import express, { response } from "express";
import Role from "../common/Role.js";
import {
  authenticate,
  authorize,
  handleValidation,
  upload,
} from "../common/common.js";
import * as controller from "../controller/admin.js";
import * as validator from "../validator/admin.js";
import { check, checkSchema } from "express-validator";

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

// get ban status for user
router.get(
  "/ban",
  authenticate(),
  authorize(),
  checkSchema(validator.BAN_STATUS),
  controller.getBanStatus,
);

router.get(
  "/bans",
  authenticate(),
  authorize(),
  checkSchema(validator.BAN_STATUS),
  controller.lazySelectUserBans,
);

router.post(
  "/ban",
  upload.none(),
  authenticate(),
  authorize(),
  checkSchema(validator.BAN),
  handleValidation,
  controller.banUser,
);

router.delete(
  "/ban",
  upload.none(),

  authenticate(),
  authorize(),
  checkSchema(validator.UNBAN),
  handleValidation,
  controller.unbanUser,
);

export default router;
