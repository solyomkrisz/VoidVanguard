import * as vec3 from "../common/vec3.js";
import * as vec2 from "../common/vec2.js";
import Rigidbody from "./Rigidbody.js";
import Model from "./Model.js";
import Block from "./Block.js";
import Shape from "./Shape.js";
import * as Type from "./Type.js";

export default class Mouse extends Rigidbody {
  constructor(game) {
    super({
      type: Type.MOUSE,
      game,
      model: new Model(
        // prettier-ignore
        [new Block({ x: 0, y: 0, shape: new Shape(false, Shape.MERGE_MODE.KEEP_ALL, 0, 0), spriteId: null, mass: 1e-10 })],
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

    this.mouseMoveEventHandler = this.mouseMoveEventHandler.bind(this);
    this.mouseDownEventHandler = this.mouseDownEventHandler.bind(this);
    this.mouseUpEventHandler = this.mouseUpEventHandler.bind(this);
  }

  enableListening() {
    document.addEventListener("mousemove", this.mouseMoveEventHandler);
    document.addEventListener("mousedown", this.mouseDownEventHandler);
    document.addEventListener("mouseup", this.mouseUpEventHandler);
  }

  disableListening() {
    document.removeEventListener("mousemove", this.mouseMoveEventHandler);
    document.removeEventListener("mousedown", this.mouseDownEventHandler);
    document.removeEventListener("mouseup", this.mouseUpEventHandler);
  }

  mouseMoveEventHandler(event) {
    const game = this.game;
    const DOMRect = game.canvasDomRect;

    const x = event.clientX - DOMRect.left;
    const y = event.clientY - DOMRect.top;

    this.ndc[0] = (2 * x) / game.canvas.width - 1;
    this.ndc[1] = 1 - (2 * y) / game.canvas.height;
  }

  mouseDownEventHandler(event) {
    event.button === 0 && (this.isDown = true);
  }

  mouseUpEventHandler(event) {
    event.button === 0 && this.reset();
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

    _b.force_1.setFromMagDir(20, dir);
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
