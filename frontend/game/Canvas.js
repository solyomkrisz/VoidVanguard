/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Canvas.js
 * Szerep: Alap canvas wrapper meret- es contextuskezelessel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import ContextMenu from "/ui/component/game/ContextMenu.js";
import * as UI from "/ui/UI.js";

export default class Canvas {
  constructor() {
    this.canvas = null;
    this.canvasDomRect = null;
    this.aspectRatio = 1;
    this.pointerLocked = false;
    this.contextMenu = null;

    this.pointerLockRequestHandler = this.pointerLockRequestHandler.bind(this);
    this.pointerLockChangeHandler = this.pointerLockChangeHandler.bind(this);
    this.pointerLockErrorHandler = this.pointerLockErrorHandler.bind(this);
  }

  start() {
    console.warn("start() is not implemented!");
  }

  stop() {
    console.warn("stop() is not implemented!");
  }

  createContextMenu() {
    // A canvas sajat context menuje itt kapcsolodik a jobbklikkhez es a sima kattintasos elrejtéshez.
    if (this.contextMenu instanceof ContextMenu || !this.hasCanvas()) {
      throw new Error(
        "Unable to create context menu: it already exists or no canvas is provided",
      );
    }

    this.contextMenu = UI.element("context-menu");
    document.body.appendChild(this.contextMenu);

    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      this.contextMenu.show();
    });

    this.canvas.addEventListener("click", () => {
      this.contextMenu.hide();
    });
  }

  hasCanvas() {
    return this.canvas && this.canvas instanceof HTMLCanvasElement;
  }

  createCanvas(append = true) {
    // Ha nincs meg renderfelulet, itt hozzuk letre, beallitjuk az alap stilust, es eltaroljuk a DOM-mereteit is.
    if (this.hasCanvas()) return;

    const canvas = document.createElement("canvas");

    this.canvas = canvas;

    canvas.style.display = "block";

    append && document.body.appendChild(canvas);

    this.canvasDomRect = canvas.getBoundingClientRect();

    this.aspectRatio = canvas.width / canvas.height;
  }

  setCanvas(selector) {
    // Ez a valtozat egy mar letezo DOM canvas elemet vesz at a wrapper ala.
    if (this.hasCanvas()) return;

    const element = document.querySelector(selector);

    if (!(element instanceof HTMLCanvasElement)) {
      throw new Error(
        `CANVAS-setCanvas: The given selector (${selector}) is not pointing to a HTMLCanvasElement!`,
      );
    }

    this.canvas.style.display = "block";

    this.canvas = element;

    this.canvasDomRect = element.getBoundingClientRect();
  }

  canvasToFullWindow() {
    // A vaszon pixelmeretet a teljes ablakmerethez igazítjuk, nem csak a CSS-meretet.
    const canvas = this.canvas;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.canvasDomRect = canvas.getBoundingClientRect();
    this.aspectRatio = canvas.width / canvas.height;
  }

  canvasToResponsiveFullWindow() {
    // Itt nemcsak egyszer meretezunk, hanem resize esemenyre is ujra lefuttatjuk a teljes ablakhoz igazítast.
    if (!this.hasCanvas()) {
      throw new Error(
        "CANVAS-canvasToResponsiveFullWindow: There is no canvas selected that could be made responsive!",
      );
    }

    this.canvasToFullWindow();
    window.addEventListener("resize", this.canvasToFullWindow.bind(this));
  }

  pointerLockChangeHandler() {
    // A pointer lock valtozasabol kepzett allapot hatarozza meg, hogy a jatek elinduljon vagy megalljon-e.
    if (document.pointerLockElement === this.canvas) {
      this.pointerLocked = true;
      this.start();
    } else {
      this.pointerLocked = false;
      this.stop();
    }
  }

  pointerLockErrorHandler() {
    console.error("Error while attempting to lock pointer!");
  }

  pointerLockRequestHandler() {
    // A tenyleges lock-kerelem kulon handlerben van, hogy ugyanaz a logika tobbszor is ujrakotheto legyen.
    if (this.pointerLocked) return;
    this.canvas.requestPointerLock();
  }

  enablePointerLock() {
    // A pointer lockhoz kulon canvas- es document-szintu eseménykezeloket kapcsolunk fel.
    if (!this.hasCanvas()) {
      console.error(
        "CANVAS-enablePointerLock: There is no canvas selected that could have pointer locked to!",
      );
    }

    this.canvas.addEventListener("click", this.pointerLockRequestHandler);

    document.addEventListener(
      "pointerlockchange",
      this.pointerLockChangeHandler,
    );

    document.addEventListener("pointerlockerror", this.pointerLockErrorHandler);
  }

  disablePointerLock() {
    // Leallitasnal a pointer lockhoz tartozo minden hallgato leszedese egy helyen tortenik.
    this.canvas.removeEventListener("click", this.pointerLockRequestHandler);
    document.removeEventListener(
      "pointerlockchange",
      this.pointerLockChangeHandler,
    );
    document.removeEventListener(
      "pointerlockerror",
      this.pointerLockErrorHandler,
    );
  }
}
