import * as vec3 from "/common/vec3.js";
import * as vec2 from "/common/vec2.js";
import Rigidbody from "/game/Rigidbody.js";
import Model from "/game/Model.js";
import Block from "/game/Block.js";
import Shape from "/game/Shape.js";
import * as Type from "/game/Type.js";

export default class Mouse extends Rigidbody {
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

    this.halfDiagonal = 0;

    this.isDown = false;
    this.dragged = null;

    this.ndc = new Float32Array([-1, -1, 1]);

    this.pointerMoveEventHandler = this.pointerMoveEventHandler.bind(this);
    this.pointerDownEventHandler = this.pointerDownEventHandler.bind(this);
    this.pointerUpEventHandler = this.pointerUpEventHandler.bind(this);

    this.activePointerId = null;
  }

  enableListening() {
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
    const el = this.game.canvas;

    el.removeEventListener("pointermove", this.pointerMoveEventHandler);
    el.removeEventListener("pointerdown", this.pointerDownEventHandler);
    el.removeEventListener("pointerup", this.pointerUpEventHandler);
    el.removeEventListener("pointercancel", this.pointerUpEventHandler);
  }

  pointerMoveEventHandler(event) {
    // if (event.pointerId !== this.activePointerId) return;

    event.preventDefault();

    const game = this.game;
    const DOMRect = game.canvasDomRect;

    const x = event.clientX - DOMRect.left;
    const y = event.clientY - DOMRect.top;

    this.ndc[0] = (2 * x) / game.canvas.width - 1;
    this.ndc[1] = 1 - (2 * y) / game.canvas.height;
  }

  pointerDownEventHandler(event) {
    event.preventDefault();

    // ignore if already tracking a finger
    if (this.activePointerId !== null) return;

    const isMouseLeft = event.pointerType === "mouse" && event.button === 0;
    const isTouch = event.pointerType === "touch";

    if (!isMouseLeft && !isTouch) return;

    this.activePointerId = event.pointerId;
    this.isDown = true;

    event.target.setPointerCapture(event.pointerId);

    this.pointerMoveEventHandler(event);
  }

  pointerUpEventHandler(event) {
    if (event.pointerId !== this.activePointerId) return;

    const isMouseLeft = event.pointerType === "mouse" && event.button === 0;
    const isTouch = event.pointerType === "touch";

    if (!isMouseLeft && !isTouch) return;

    this.activePointerId = null;

    this.reset();

    event.target.releasePointerCapture(event.pointerId);
  }

  reset() {
    this.isDown = false;
    this.detach();
  }

  attach(entity) {
    this.dragged = entity;
  }

  detach() {
    this.dragged = null;
  }

  drag() {
    const _b = this.game.buffer;

    const dragged = this.dragged;
    if (!dragged) return;

    const dir = vec2.sub(_b.vec2_1, this.position, dragged.position);
    vec2.normalize(dir, dir);

    _b.force_1.setFromMagDir(50, dir);
    dragged.netForce.apply(_b.force_1);
  }

  // prettier-ignore
  update() {
    const _b = this.game.buffer;

    this.hovered = null;

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
