import Game from "/game/Game.js";
import * as jwt from "/common/jwt.js";
import { logout, isAdmin } from "/common/common.js";
import "/ui/component/game/SaveMenu.js";
import "/ui/component/feedback/ToastManager.js";

let game = null;

// --- Friends button ---
const friendsBtn = document.getElementById("friendsBtn");

friendsBtn.addEventListener("click", () => {
  friendsBtn.classList.remove("pressed");
  void friendsBtn.offsetWidth;
  friendsBtn.classList.add("pressed");

  if (hasValidToken()) {
    window.location.href = "/me?active=accepted-friend-requests";
    return;
  }

  window.location.href = "/profile";
});

// --- Settings panel toggle ---
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");

function isSettingsPanelOpen() {
  return (
    settingsPanel.style.display === "flex" &&
    !settingsPanel.classList.contains("closing")
  );
}

function closeSettingsPanelImmediate() {
  settingsPanel.style.display = "none";
  settingsPanel.style.visibility = "";
  settingsPanel.classList.remove("open", "closing");
}

function positionSettingsPanel() {
  const btnRect = settingsBtn.getBoundingClientRect();
  const panelRect = settingsPanel.getBoundingClientRect();
  const viewportPad = Math.max(8, Math.round(window.innerWidth * 0.01));
  const gap = Math.max(8, Math.round(window.innerHeight * 0.01));

   const compactLayout = window.innerWidth <= 900 || window.innerHeight <= 560;
   if (compactLayout) {
    settingsPanel.style.left = `${viewportPad}px`;
    settingsPanel.style.top = `${viewportPad}px`;
    settingsPanel.style.right = "auto";
    settingsPanel.style.width = `calc(100vw - ${viewportPad * 2}px)`;
    settingsPanel.style.maxWidth = `calc(100vw - ${viewportPad * 2}px)`;
    settingsPanel.style.maxHeight = `calc(100dvh - ${viewportPad * 2}px)`;
    return;
  }

  settingsPanel.style.width = "";
  settingsPanel.style.maxWidth = "";
  settingsPanel.style.maxHeight = "";

  let top = btnRect.bottom + gap;
  let left = btnRect.right - panelRect.width;

  if (left < viewportPad) {
    left = viewportPad;
  }

  const maxLeft = window.innerWidth - viewportPad - panelRect.width;
  if (left > maxLeft) {
    left = maxLeft;
  }

  if (top + panelRect.height > window.innerHeight - viewportPad) {
    top = btnRect.top - panelRect.height - gap;
  }

  if (top < viewportPad) {
    top = viewportPad;
  }

  settingsPanel.style.top = `${Math.round(top)}px`;
  settingsPanel.style.left = `${Math.round(left)}px`;
  settingsPanel.style.right = "auto";
}

settingsBtn.addEventListener("click", () => {
  const isOpen = isSettingsPanelOpen();

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
    settingsPanel.style.visibility = "hidden";
    settingsPanel.classList.remove("closing");
    positionSettingsPanel();
    settingsPanel.style.visibility = "";
    void settingsPanel.offsetWidth;
    settingsPanel.classList.add("open");
  }

  settingsBtn.classList.remove("pressed");
  void settingsBtn.offsetWidth;
  settingsBtn.classList.add("pressed");
  settingsBtn.blur();
});

window.addEventListener("resize", () => {
  if (isSettingsPanelOpen()) {
    positionSettingsPanel();
  }
});

window.addEventListener("orientationchange", () => {
  if (isSettingsPanelOpen()) {
    positionSettingsPanel();
  }
});

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => {
    if (isSettingsPanelOpen()) {
      positionSettingsPanel();
    }
  });
}

// --- Settings checkboxes — always reference the current game instance ---
const toggleNebula = document.getElementById("toggleNebula");
const toggleChunkDebug = document.getElementById("toggleChunkDebug");
const toggleGridCells = document.getElementById("toggleGridCells");
const toggleEntityIds = document.getElementById("toggleEntityIds");
const toggleSpaceshipCircle = document.getElementById("toggleSpaceshipCircle");
const toggleSpaceshipHitbox = document.getElementById("toggleSpaceshipHitbox");

toggleNebula.addEventListener("change", (e) => {
  if (game) game.showNebula = e.target.checked;
});
toggleChunkDebug.addEventListener("change", (e) => {
  if (game) game.showChunkDebug = e.target.checked;
});
toggleGridCells.addEventListener("change", (e) => {
  if (game) game.showGridCells = e.target.checked;
});
toggleEntityIds.addEventListener("change", (e) => {
  if (game) game.showEntityIds = e.target.checked;
});
toggleSpaceshipCircle.addEventListener("change", (e) => {
  if (game) game.showSpaceshipCircle = e.target.checked;
});
toggleSpaceshipHitbox.addEventListener("change", (e) => {
  if (game) game.showSpaceshipHitbox = e.target.checked;
});

// --- Game menu ---
function showGameMenu() {
  document.getElementById("gameMenuMain").classList.remove("hidden");
  document.getElementById("gameMenuLoad").classList.add("hidden");
  document.getElementById("gameMenu").classList.remove("hidden");
}

function startGame(save = null, saveType = null) {
  document.getElementById("gameMenu").classList.add("hidden");
  friendsBtn.style.display = "none";

  game = Game.from(save);

  if (saveType) {
    game.saveType = saveType;
  }

  game.showNebula = toggleNebula.checked;
  game.showChunkDebug = toggleChunkDebug.checked;
  game.showGridCells = toggleGridCells.checked;
  game.showEntityIds = toggleEntityIds.checked;
  game.showSpaceshipCircle = toggleSpaceshipCircle.checked;
  game.showSpaceshipHitbox = toggleSpaceshipHitbox.checked;

  game.start();
}

function forceAuthView() {
  game = null;
  friendsBtn.style.display = "block";
  document.getElementById("adminPanelBtn").hidden = true;
  document.getElementById("gameMenu").classList.add("hidden");
  closeSettingsPanelImmediate();
  document.documentElement.classList.remove("has-token");
  document.getElementById("authContainer").classList.remove("hidden");
  const logFormMsg = document.getElementById("logFormMsg");
  logFormMsg.className = "form-message";
  logFormMsg.textContent = "";
}

function hasValidToken() {
  return Boolean(localStorage.getItem("access_token"));
}

function applyAuthState() {
  if (hasValidToken()) {
    document.documentElement.classList.add("has-token");
    document.getElementById("authContainer").classList.add("hidden");
    friendsBtn.style.display = "block";
    document.getElementById("adminPanelBtn").hidden = !isAdmin();
    if (!game) showGameMenu();
    return true;
  }

  localStorage.removeItem("access_token");
  localStorage.removeItem("access_token_decoded");
  forceAuthView();

  return false;
}

document
  .getElementById("newGameBtn")
  .addEventListener("click", () => startGame(null));

document
  .getElementById("gameMenuLogoutBtn")
  .addEventListener("click", () => logout());
document.getElementById("adminPanelBtn").addEventListener("click", () => {
  window.location.href = "/admin";
});
document.getElementById("leaderboardBtn").addEventListener("click", () => {
  window.location.href = "/leaderboard";
});

let _saveMenu = null;

document.getElementById("loadGameBtn").addEventListener("click", () => {
  if (!_saveMenu) {
    _saveMenu = document.createElement("save-menu");
    _saveMenu.setAttribute("remote-save-list-controls", "load delete");
    document.getElementById("gameMenuSaveSlot").appendChild(_saveMenu);
  }
  document.getElementById("gameMenuMain").classList.add("hidden");
  document.getElementById("gameMenuLoad").classList.remove("hidden");
});

document.getElementById("backBtn").addEventListener("click", () => {
  document.getElementById("gameMenuLoad").classList.add("hidden");
  document.getElementById("gameMenuMain").classList.remove("hidden");
});

document
  .getElementById("gameMenu")
  .addEventListener("save-load-request", (e) => {
    const save = e?.detail?.save;
    const saveType = e?.detail?.saveType;

    console.log(save, saveType);
    if (!save || !saveType) return;

    startGame(save, saveType);
  });

// --- Auth / lifecycle events ---
document.addEventListener("login", () => {
  applyAuthState();
});

document.addEventListener("exit-game", () => {
  console.log("exit-gameexit-gameexit-game");
  game = null;
  friendsBtn.style.display = "block";
  showGameMenu();
});

document.addEventListener("game-volume-change", (e) => {
  const volume = e?.detail?.volume;
  if (volume == null || !game) return;
  game.setVolume(volume);
});

document.addEventListener("logout", () => {
  applyAuthState();
});

// --- Check auth state on initial load ---
applyAuthState();
