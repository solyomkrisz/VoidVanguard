import Game from "./Game.js";

export default class Keyboard {
  static KeyW = "KeyW";
  static KeyA = "KeyA";
  static KeyS = "KeyS";
  static KeyD = "KeyD";
  static Space = "Space";
  static Escape = "Escape";

  constructor(game) {
    if (!(game instanceof Game)) {
      throw new Error(
        "KEYBOARD-constructor: game must be an instance of the Game class!"
      );
    }

    this.game = game;
    this.observed = new Set();
    this.activeControls = new Set();

    this.keydownEventHandler = this.keydownEventHandler.bind(this);
    this.keyupEventHandler = this.keyupEventHandler.bind(this);
  }

  observeKey(key) {
    if (typeof key !== "string") {
      throw new Error("KEYBOARD-observeKey: The argument must be a string!");
    }

    this.observed.add(key);
  }

  enableListening() {
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

  keydownEventHandler(event) {
    const key = event.code;

    if (this.observed.has(key)) {
      this.activeControls.add(key);
    } else if (key === Keyboard.Escape && !event.repeat) this.game.stop();
  }

  keyupEventHandler(event) {
    const key = event.code;
    if (this.observed.has(key)) this.activeControls.delete(key);
  }
}
