import Collidable from "../Collidable.js";
import Collider from "../Collider.js";
import Grid from "../Grid.js";
import Rigidbody from "../Rigidbody.js";
import * as vec2 from "../../common/vec2.js";
import * as vec3 from "../../common/vec3.js";

export default class BC extends Collider {
  static DIRTY = Object.freeze({
    NONE: 0,
    RADIUS: 1 << 0, // model has changed -> recalculate BC radius
    BOUNDS: 1 << 1, // world position changed -> recalculate min and max bounds of BC
  });

  constructor(entity = null) {
    super(entity);

    this.dirty = BC.DIRTY.RADIUS | BC.DIRTY.BOUNDS;
    this.r = 0;
    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;
  }

  onAttach(entity) {
    this.entity = entity;
  }

  onGeometryChange() {
    this.dirty |= BC.DIRTY.RADIUS | BC.DIRTY.BOUNDS;
  }

  onPositionChange() {
    this.dirty |= BC.DIRTY.BOUNDS;
  }

  onRotationChange() {
    return;
  }

  validate() {
    if (this.dirty === BC.DIRTY.NONE) return;

    this.set();
  }

  set() {
    const cellSize = this.entity.game.grid.cellSize;

    if (this.dirty & BC.DIRTY.RADIUS) {
      let maxDSq = 0;

      for (let i = 0; i < this.entity.model.objects.length; i++) {
        const object = this.entity.model.objects[i];

        const [lx, ly] = object.localPosition;

        const dx = lx - Collidable.MODEL_CENTER[0];
        const dy = ly - Collidable.MODEL_CENTER[1];

        const dSq = dx * dx + dy * dy;

        if (dSq > maxDSq) maxDSq = dSq;
      }

      this.r = Math.sqrt(maxDSq) + this.entity.halfDiagonal;
      this.dirty &= ~BC.DIRTY.RADIUS;
    }

    if (this.dirty & BC.DIRTY.BOUNDS) {
      const [x, y] = this.entity.position;

      this.minX = Grid.TO_CELL(x - this.r, cellSize);
      this.minY = Grid.TO_CELL(y - this.r, cellSize);
      this.maxX = Grid.TO_CELL(x + this.r, cellSize);
      this.maxY = Grid.TO_CELL(y + this.r, cellSize);

      this.dirty &= ~BC.DIRTY.BOUNDS;
    }
  }

  register() {
    const grid = this.entity.game.grid;
    this.entity.cell.length = 0;

    for (let x = this.minX; x <= this.maxX; x++) {
      for (let y = this.minY; y <= this.maxY; y++) {
        const key = Grid.GET_KEY(x, y);
        this.entity.cell.push(key);

        if (!grid.cells.has(key)) grid.cells.set(key, new Grid.CELL());

        const cell = grid.cells.get(key);
        cell.objects.push(this.entity);
        cell.idle = 0;
      }
    }
  }

  /**
   * Checks if two bounding circles collide.
   *
   * @param {Rigidbody} a - Object A.
   * @param {Rigidbody} b - Object B.
   * @returns {boolean} - True if they are colliding, otherwise false.
   */
  intersects(other) {
    const dx = this.entity.position[0] - other.position[0];
    const dy = this.entity.position[1] - other.position[1];

    const distSq = dx * dx + dy * dy;
    const rSum = this.entity.proxyCollider.r + other.proxyCollider.r;

    return distSq <= rSum * rSum;
  }

  // prettier-ignore
  debug() {
    const g = this.entity.game, b = g.buffer, d = g.debugOverlay;

    const worldSpace = vec2.toVec3(b.vec3_1, this.entity.interpolatedPosition);
    const [x, y] = vec3.toVec2(b.vec2_1, vec3.transformMat3Into(worldSpace, g.cameraMatrix, worldSpace));

    const screenCoords = vec2.set(b.vec2_1, (x + 1) * 0.5 * g.canvas.width, (1 - y) * 0.5 * g.canvas.height);
    const r = this.r * g.cameraMatrix[0] * 0.5 * g.canvas.width;

    if (g.showSpaceshipCircle)
    {
      d.drawCircle(...screenCoords, r, "#0ff");
    }
    if (g.showEntityIds) {
      d.drawText(screenCoords[0], screenCoords[1] - r - 10, `id: ${this.entity.id}`, "20px Jersey", "#fff");
      d.drawText(screenCoords[0] + r, screenCoords[1] + r, this.entity.cell.join(" | "), "20px Jersey", "#fff");
    }
  }
}
