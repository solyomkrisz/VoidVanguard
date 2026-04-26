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
    onValidAccessToken: (_, _1, next) => next(),
    onInvalidAccessToken: (_, response, _1) => {
      response.redirect("/");
      //   response.sendFile(
      //     path.join(__dirname, "../../frontend/ui/html/error.html"),
      //   );
    },
  }),
  (request, response) => {
    response.sendFile(path.join(__dirname, "../../frontend/ui/html/me.html"));
  },
);

export default router;
