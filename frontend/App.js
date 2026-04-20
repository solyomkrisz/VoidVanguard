import Game from "/game/Game.js";
import Block from "/game/Block.js";
import DebugPanel from "/game/DebugPanel.js";
import Keyboard from "/game/Keyboard.js";
import TextureManager from "/game/TextureManager.js";
import Sprite from "/game/Sprite.js";
import { TextureID, SpriteID } from "/game/texture/Texture.js";
import Enemy from "/game/Enemy.js";
import DebugOverlay from "/game/DebugOverlay.js";
import BlockStyle from "/game/BlockStyle.js";
import Model from "/game/Model.js";
import { GlobalState } from "/game/State.js";
import Shape from "/game/Shape.js";
import Mouse from "/game/Mouse.js";
import BuildingBlock from "/game/BuildingBlock.js";
import Models from "/game/SpaceShipModels.js";
import Thruster from "/game/Thruster.js";
import * as UI from "/ui/UI.js";
import _ from "/ui/component/game/ContextMenuTemplate.js";
import * as jwt from "/common/jwt.js";
import { setupGame } from "/game/setup/default.js";

// Wire up settings button at page load so it works on the login screen too
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
settingsBtn.addEventListener("click", () => {
  const isOpen =
    settingsPanel.style.display === "flex" &&
    !settingsPanel.classList.contains("closing");

  if (isOpen) {
    settingsPanel.classList.remove("open");
    settingsPanel.classList.add("closing");
    settingsPanel.addEventListener(
      "animationend",
      () => {
        settingsPanel.style.display = "none";
        settingsPanel.classList.remove("closing");
      },
      { once: true },
    );
  } else {
    settingsPanel.style.display = "flex";
    settingsPanel.classList.remove("closing");
    void settingsPanel.offsetWidth;
    settingsPanel.classList.add("open");
  }

  settingsBtn.classList.remove("pressed");
  void settingsBtn.offsetWidth;
  settingsBtn.classList.add("pressed");
});

// Most itt igy megvarjuk hogy legyen login
document.addEventListener("login", () => {
  console.log("Login esemeny megkapva, jatek inditasa...");
  initializeGame();
});

const game = new Game();

// Jatek elinditasa login utan
function initializeGame() {
  if (game.running) return;

  setupGame(game);
  game.start();

  // Wire up game flags from checkbox states (HTML is the single source of truth)
  const toggleNebula = document.getElementById("toggleNebula");
  const toggleChunkDebug = document.getElementById("toggleChunkDebug");
  const toggleGridCells = document.getElementById("toggleGridCells");
  const toggleEntityIds = document.getElementById("toggleEntityIds");
  const toggleSpaceshipCircle = document.getElementById(
    "toggleSpaceshipCircle",
  );
  const toggleSpaceshipHitbox = document.getElementById(
    "toggleSpaceshipHitbox",
  );

  game.showNebula = toggleNebula.checked;
  game.showChunkDebug = toggleChunkDebug.checked;
  game.showGridCells = toggleGridCells.checked;
  game.showEntityIds = toggleEntityIds.checked;
  game.showSpaceshipCircle = toggleSpaceshipCircle.checked;
  game.showSpaceshipHitbox = toggleSpaceshipHitbox.checked;

  toggleNebula.addEventListener("change", (e) => {
    game.showNebula = e.target.checked;
  });

  toggleChunkDebug.addEventListener("change", (e) => {
    game.showChunkDebug = e.target.checked;
  });

  toggleGridCells.addEventListener("change", (e) => {
    game.showGridCells = e.target.checked;
  });

  toggleEntityIds.addEventListener("change", (e) => {
    game.showEntityIds = e.target.checked;
  });

  toggleSpaceshipCircle.addEventListener("change", (e) => {
    game.showSpaceshipCircle = e.target.checked;
  });

  toggleSpaceshipHitbox.addEventListener("change", (e) => {
    game.showSpaceshipHitbox = e.target.checked;
  });
}

// Check if already logged in on page load
const token = sessionStorage.getItem("access_token");
if (token) {
  console.log("Talalt meglévő token:", token);

  // Check if real JWT is expired
  const isExpired = jwt.isExpired(token);
  console.log("JWT token lejárt?", isExpired);

  if (!isExpired) {
    console.log("Érvényes JWT találva, játék indítása...");
    document.getElementById("authContainer").classList.add("hidden");
    initializeGame();
  } else {
    console.log(
      "Token lejárt, törlés és bejelentkező képernyő megjelenítése...",
    );
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token_decoded");
  }
} else {
  console.log("Nincs token, bejelentkező képernyő megjelenítése...");
}
