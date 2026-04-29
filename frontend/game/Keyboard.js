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
    if (!(game instanceof Game)) {
      throw new Error(
        "KEYBOARD-setGame: The given argument is not a Game instance",
      );
    }

    this.game = game;
  }

  observeKey(key) {
    if (typeof key !== "string") {
      throw new Error("KEYBOARD-observeKey: The argument must be a string!");
    }

    this.observed.add(key);
  }

  enableListening() {
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

    if (this.observed.has(key)) {
      this.game.activeControls.add(key);
    } else if (key === Keyboard.Escape && !event.repeat) {
      const pauseMenu = this.game?.UI?.pauseMenu;

      console.log("isRunning: ", this.game.running);
      if (this.game.running) {
        this.game.stop();
      } else if (pauseMenu && !pauseMenu.hidden) {
        this.game.resume();
        console.log("JÁTÉK FOLYTATVA");
      }
    }
  }

  keyupEventHandler(event) {
    const key = event.code;
    if (this.observed.has(key)) this.game.activeControls.delete(key);
  }
}
