require("dotenv").config();
//!Module-ok importálása
const express = require("express"); //?npm install express
const cookerParser = require("cookie-parser"); //?npm install cookie-parser
const path = require("path");

//!Beállítások
const app = express();
const router = express.Router();

const ip = process.env.SERVER_IP;
const port = process.env.SERVER_PORT;

app.use(express.json()); //?Middleware JSON
app.use(express.urlencoded({ extended: true })); //?Middleware URL-encoded adatok
app.use(cookerParser()); //?Middleware Cookie-k
app.set("trust proxy", 1); //?Middleware Proxy

//!Routing
//?Főoldal:
router.get("/", (request, response) => {
  response.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Teszt oldal
router.get("/test", (request, response) => {
  response.sendFile(path.join(__dirname, "../frontend/test.html"));
});

//!API endpoints
app.use("/", router);
const endpoints = require("./api/api.js");
app.use("/api", endpoints);

//!Szerver futtatása
app.use(express.static(path.join(__dirname, "../frontend"))); //?frontend mappa tartalmának betöltése az oldal működéséhez
app.listen(port, ip, () => {
  console.log(`Szerver elérhetősége: http://${ip}:${port}`);
});
