/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Mouse.js
 * Szerep: Eger- es pointerallapotot koveto bemeneti seged.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as vec3 from "/common/vec3.js";
import * as vec2 from "/common/vec2.js";
import Rigidbody from "/game/Rigidbody.js";
import Model from "/game/Model.js";
import Block from "/game/Block.js";
import Shape from "/game/Shape.js";
import * as Type from "/game/Type.js";

export default class Mouse extends Rigidbody {
  static BASE_DRAG_FORCE = 70;
  static INITIAL_DRAG_BOOST_MULTIPLIER = 1.7;
  static INITIAL_DRAG_BOOST_DURATION = 0.35;

  constructor(game) {
    super({
      type: Type.MOUSE,
      game,
      model: new Model(
        // prettier-ignore
        [new Block({ x: 0, y: 0, shape: new Shape(false, Shape.MERGE_MODE.KEEP_ALL, 0, 0), spriteID: null, mass: 1e-10 })],
        Model.COPY_MODE.PRESERVE,
      ),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    });

    this.id = game.idManager.get();

  // Az egermutato fizikai testkent viselkedik a collision-rendszerben, de gyakorlatilag pontszeru hitboxszal.
    this.halfDiagonal = 0;

    this.isDown = false;
    this.dragged = null;

    this.ndc = new Float32Array([-1, -1, 1]);

    this.pointerMoveEventHandler = this.pointerMoveEventHandler.bind(this);
    this.pointerDownEventHandler = this.pointerDownEventHandler.bind(this);
    this.pointerUpEventHandler = this.pointerUpEventHandler.bind(this);

    this.activePointerId = null;
    this.dragDelayTimer = null;
    this.dragDelay = 200; // milliseconds before drag starts on touch
    this.dragElapsed = 0;
  }

  enableListening() {
    // Az inputkezeles kozvetlenul a jatek canvasara van kotve, hogy a pointer koordinatai mindig a renderfelulethez igazodjanak.
    const el = this.game.canvas;

    el.addEventListener("pointermove", this.pointerMoveEventHandler, {
      passive: false,
    });
    el.addEventListener("pointerdown", this.pointerDownEventHandler, {
      passive: false,
    });
    el.addEventListener("pointerup", this.pointerUpEventHandler, {
      passive: false,
    });
    el.addEventListener("pointercancel", this.pointerUpEventHandler);
  }

  disableListening() {
    // Megallitasnal vagy destroy eseten le kell venni az osszes handlert, kulonben a regi Game példány tovabb figyelne az esemenyeket.
    const el = this.game.canvas;

    el.removeEventListener("pointermove", this.pointerMoveEventHandler);
    el.removeEventListener("pointerdown", this.pointerDownEventHandler);
    el.removeEventListener("pointerup", this.pointerUpEventHandler);
    el.removeEventListener("pointercancel", this.pointerUpEventHandler);
  }

  pointerMoveEventHandler(event) {
    // if (event.pointerId !== this.activePointerId) return;

    // A DOM koordinatakat itt alakitjuk at normalizalt device coordinate-ra, mert a kamera-visszatranszformacio kesobb ebbol indul.
    event.preventDefault();

    const game = this.game;
    const DOMRect = game.canvasDomRect;

    const x = event.clientX - DOMRect.left;
    const y = event.clientY - DOMRect.top;

    this.ndc[0] = (2 * x) / game.canvas.width - 1;
    this.ndc[1] = 1 - (2 * y) / game.canvas.height;
  }

  pointerDownEventHandler(event) {
    // Egyszerre csak egy aktiv pointert kovetunk, kulonben a drag-logika tobb ujjal vagy egerekkel osszekeveredne.
    event.preventDefault();

    // ignore if already tracking a finger
    if (this.activePointerId !== null) return;

    const isMouseLeft = event.pointerType === "mouse" && event.button === 0;
    const isTouch = event.pointerType === "touch";

    if (!isMouseLeft && !isTouch) return;

    this.activePointerId = event.pointerId;

    event.target.setPointerCapture(event.pointerId);

    this.pointerMoveEventHandler(event);

    // for touch we delay drag start to allow normal working of tooltip
    if (isTouch) {
      this.dragDelayTimer = setTimeout(() => {
        this.isDown = true;
        this.dragDelayTimer = null;
      }, this.dragDelay);

      // if its a mouse left click start drag immediately
    } else {
      this.isDown = true;
    }
  }

  pointerUpEventHandler(event) {
    // Felengedesre minden drag-allapotot egyszerre zarunk le: pointer, keslelteto timer es a csatolt objektum is itt nullazodik.
    if (event.pointerId !== this.activePointerId) return;

    const isMouseLeft = event.pointerType === "mouse" && event.button === 0;
    const isTouch = event.pointerType === "touch";

    if (!isMouseLeft && !isTouch) return;

    this.activePointerId = null;

    // cancel drag delay timer if still pending
    if (this.dragDelayTimer !== null) {
      clearTimeout(this.dragDelayTimer);
      this.dragDelayTimer = null;
    }

    this.reset();

    event.target.releasePointerCapture(event.pointerId);
  }

  reset() {
    // Ez a kozos takarito pont a touch megszakitas, az egérfelengedes es mas leallasi utak szamara.
    this.isDown = false;
    this.detach();
  }

  attach(entity) {
    // Ujonnan megfogott entitasnal ujrainditjuk a drag időzítését, hogy az indulasi boost és a snap-kesleltetes konzisztens maradjon.
    if (this.dragged !== entity) {
      this.dragElapsed = 0;
      entity?.onDragStart?.();
    }

    this.dragged = entity;
  }

  detach() {
    this.dragged = null;
  }

  drag() {
    const _b = this.game.buffer;

    const dragged = this.dragged;
    if (!dragged) return;

    // A drag nem teleport, hanem erot fejt ki a megragadott testre, igy a mozgas beleillik a fizikai rendszer tobbi reszebe.
    this.dragElapsed += this.game.fdt;
    dragged.onDragged?.(this.game.fdt);

    const dir = vec2.sub(_b.vec2_1, this.position, dragged.position);
    vec2.normalize(dir, dir);

    let forceMagnitude = Mouse.BASE_DRAG_FORCE;
    if (this.dragElapsed <= Mouse.INITIAL_DRAG_BOOST_DURATION) {
      forceMagnitude *= Mouse.INITIAL_DRAG_BOOST_MULTIPLIER;
    }

    _b.force_1.setFromMagDir(forceMagnitude, dir);
    dragged.netForce.apply(_b.force_1);
  }

  // prettier-ignore
  update() {
    const _b = this.game.buffer;

    this.hovered = null;

    // A kamera inverz matrixa viszi at a kurzort a kepernyokoordinatakbol vilagkoordinataba.
    vec3.copy(_b.vec3_1, this.ndc);
    vec3.transformMat3Into(_b.vec3_1, this.game.cameraMatrixInverse, _b.vec3_1);
    vec3.toVec2(this.position, _b.vec3_1);

    this.drag();

    if (!vec2.isEqual(this.position, this.previousPosition, 0)) {
      this.proxyCollider.onPositionChange();
      this.shapeCollider.onPositionChange();
    }
  }

  onBroadCollision(other) {
    return true;
  }

  onNarrowCollision(other) {
    this.game.contextMenu.hovered = other;
    return true;
  }

  onContact(collision, object) {
    return false;
  }
}
