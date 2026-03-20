import "dotenv/config";
import express from "express";
import cookerParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import endpoints from "./api/api.js";

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
router.get("/profile/:id", (request, response) => {
  response.sendFile(path.join(__dirname, "../frontend/profile.html"));
});

// Teszt oldal
router.get("/test", (request, response) => {
  response.sendFile(path.join(__dirname, "../frontend/test.html"));
});

router.get("/test2", (request, response) => {
  response.sendFile(path.join(__dirname, "../frontend/test2.html"));
});

app.use("/", router);
app.use("/api", endpoints);

app.use(express.static(path.join(__dirname, "../frontend"))); //?frontend mappa tartalmának betöltése az oldal működéséhez
app.listen(port, ip, () => {
  console.log(`Szerver elérhetősége: http://${ip}:${port}`);
});
