/**
 * Kezdobarat magyarazat:
 * Fajl: backend/api/api.js
 * Szerep: API reteg: HTTP endpoint definicio, keretek kozotti tovabbitas a controllernek.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import express from "express";
import users from "./users.js";
import sessions from "./sessions.js";
import tokens from "./tokens.js";
import profiles from "./profiles.js";
import friends from "./friends.js";
import blocks from "./blocks.js";
import comments from "./comments.js";
import reactions from "./reactions.js";
import admin from "./admin.js";
import saves from "./saves.js";
import passwordresets from "./passwordresets.js";
import scores from "./scores.js";

const router = express.Router();

// Gyors ellenorzo endpoint arra, hogy az API gyoker elerheto-e a kliens felol.
router.get("/test", (request, response) => {
  response.status(200).json({
    message: "Ez a végpont működik.",
  });
});

// Az alabbi mountpontok osztjak fel a teljes API-t temankent kulon routerekre.
router.use("/users", users); // Felhasznalo-kereses, regisztracio, sajat fiok modositasa.
router.use("/sessions", sessions); // Bejelentkezes es aktiv munkamenet-vegpontok.
router.use("/tokens", tokens); // Refresh token alapú session-megujitas es sessionkezeles.
router.use("/profiles", profiles); // Nyilvanos es vedett profiladatok.
router.use("/friends", friends); // Ismerosjelolesek, baratlista es kapcsolati statusz.
router.use("/blocks", blocks); // Tiltasi lista es blokkolasi muveletek.
router.use("/comments", comments); // Profilhoz vagy celobjektumhoz tartozo hozzaszolasok.
router.use("/reactions", reactions); // Like/dislike jellegu reakciok.
router.use("/admin", admin); // Admin tiltasi es ellenorzesi vegpontok.
router.use("/saves", saves); // Jatekmentesek letrehozasa, frissitese, torlese.
router.use("/reset-password", passwordresets); // Jelszo-visszaallitasi tokenkeres es jelszocsere.
router.use("/scores", scores); // Toplistak es sajat pontszamok.

export default router;
