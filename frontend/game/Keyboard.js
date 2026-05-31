/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Keyboard.js
 * Szerep: Billentyuallapotokat figyelo es gyorsan lekerdezheto inputseged.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Game from "/game/Game.js";

export default class Keyboard {
  static KeyW = "KeyW";
  static KeyA = "KeyA";
  static KeyS = "KeyS";
  static KeyD = "KeyD";
  static Space = "Space";
  static Escape = "Escape";
  static LCtrl = "ControlLeft";
  static LShift = "ShiftLeft";
  static KeyR = "KeyR";

  constructor() {
    this.game = null;
    this.observed = new Set();

    this.keydownEventHandler = this.keydownEventHandler.bind(this);
    this.keyupEventHandler = this.keyupEventHandler.bind(this);
  }

  setGame(game) {
    // A billentyuzet csak akkor tud allapotot modositani, ha tudja melyik Game peldany activeControls halmazat kell irnia.
    if (!(game instanceof Game)) {
      throw new Error(
        "KEYBOARD-setGame: The given argument is not a Game instance",
      );
    }

    this.game = game;
  }

  observeKey(key) {
    // Csak az itt felvett billentyuk kerulnek be a folyamatosan figyelt, nyomvatartott inputok koze.
    if (typeof key !== "string") {
      throw new Error("KEYBOARD-observeKey: The argument must be a string!");
    }

    this.observed.add(key);
  }

  enableListening() {
    // A globalis dokumentumra hallgatunk, hogy a jatekos akkor is tudjon iranyitani, ha a fokusz nem egy kulon inputmezore esik.
    if (!this.game) return;

    if (document.addEventListener) {
      document.addEventListener("keydown", this.keydownEventHandler);
      document.addEventListener("keyup", this.keyupEventHandler);
    } else if (document.attachEvent) {
      document.attachEvent("onkeydown", this.keydownEventHandler);
      document.attachEvent("onkeyup", this.keyupEventHandler);
    }
  }

  disableListening() {
    // Leallitasnal ugyanazokat a handlereket vesszuk le, amelyeket enableListening alatt regisztraltunk.
    if (document.addEventListener) {
      document.removeEventListener("keydown", this.keydownEventHandler);
      document.removeEventListener("keyup", this.keyupEventHandler);
    } else if (document.attachEvent) {
      document.detachEvent("onkeydown", this.keydownEventHandler);
      document.detachEvent("onkeyup", this.keyupEventHandler);
    }
  }

  destroy() {
    this.disableListening();
  }

  keydownEventHandler(event) {
    const key = event.code;

    // A megfigyelt iranyitobillentyuk bekerulnek az aktiv halmazba, az Escape pedig kulon pause/continue gyorsbillentyu.
    if (this.observed.has(key)) {
      this.game.activeControls.add(key);
    } else if (key === Keyboard.Escape && !event.repeat) {
      const pauseMenu = this.game?.UI?.pauseMenu;

      if (this.game.running) {
        this.game.stop();
      } else if (pauseMenu && !pauseMenu.hidden) {
        this.game.resume();
      }
    }
  }

  keyupEventHandler(event) {
    const key = event.code;
    // Felengedesnel egyszeruen kivesszuk a billentyut az aktiv halmazbol.
    if (this.observed.has(key)) this.game.activeControls.delete(key);
  }
}
