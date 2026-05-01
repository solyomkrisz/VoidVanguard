import "dotenv/config";
import express from "express";
import cookerParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import endpoints from "./api/api.js";

import Role from "./common/Role.js";
import { authenticate, authorize } from "./common/common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const router = express.Router();

const ip = process.env.SERVER_IP;
const port = process.env.SERVER_PORT;

app.use(express.json()); //?Middleware JSON
app.use(express.urlencoded({ extended: true })); //?Middleware URL-encoded adatok
app.use(cookerParser()); //?Middleware Cookie-k
app.set("trust proxy", 1); //?Middleware Proxy

// Főoldal
router.get("/", (request, response) => {
  response.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Profil oldal
router.get("/profile", (request, response) => {
  response.sendFile(path.join(__dirname, "../frontend/ui/html/profile.html"));
});

router.get("/profile/:id", (request, response) => {
  response.sendFile(path.join(__dirname, "../frontend/ui/html/profile.html"));
});

// Én oldal
router.get("/me", (request, response) => {
  response.sendFile(path.join(__dirname, "../frontend/ui/html/me.html"));
});

// Game oldal
router.get("/game", (request, response) => {
  response.sendFile(path.join(__dirname, "../frontend/ui/html/game.html"));
});

// Password reset oldal
router.get(
  "/reset-password",
  function (request, response, next) {
    if (!request.query?.token) {
      response.sendFile(path.join(__dirname, "../frontend/ui/html/error.html"));
      return;
    }

    next();
  },
  (request, response) => {
    response.sendFile(
      path.join(__dirname, "../frontend/ui/html/passwordreset.html"),
    );
  },
);
// Leaderboard oldal
router.get("/leaderboard", (request, response) => {
  response.sendFile(
    path.join(__dirname, "../frontend/ui/html/leaderboard.html"),
  );
});

router.get("/admin", (request, response) => {
  response.sendFile(path.join(__dirname, "../frontend/ui/html/admin.html"));
});

// Teszt oldal
router.get("/test/functional", (request, response) => {
  response.sendFile(
    path.join(__dirname, "../frontend/ui/html/functionaltest.html"),
  );
});

router.get("/test/unit", (request, response) => {
  response.sendFile(path.join(__dirname, "../frontend/ui/html/unittest.html"));
});

app.use("/", router);
app.use("/api", endpoints);

app.use(express.static(path.join(__dirname, "../frontend"))); //?frontend mappa tartalmának betöltése az oldal működéséhez

app.listen(port, ip, () => {
  console.log(`Szerver elérhetősége: http://${ip}:${port}`);
});
